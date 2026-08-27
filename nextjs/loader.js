import { isbot } from "isbot";
import { cookies, headers } from "next/headers";
import { executeMserver } from "./server_bridge";
import { getCountryLangs } from "../common/country_lang.js";
import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGES_LIST } from "core/common_values.js";
import { getLocales } from "./config/locale.js";
import { getThemeDateContext, shouldBe, stripLangFromUrl } from "./methods.dual";
import { notFound, redirect, unauthorized } from "next/navigation";
import { cache } from "react";

const getDedupeLoaderData = cache(() => {
    let resolve;
    let reject;

    const promise =
        new Promise((success, failure) => {
            resolve = success;
            reject = failure;
        });

    return { promise, resolve, reject, settled: false, has_root: false, has_install: false };
});

export const RootLoaderContext = Symbol('root_loader');

/**
 * @type {getDedupeLoaderData}
 */
export const getLoaderDataSync = () => {
    const engine = getDedupeLoaderData();

    return new Proxy({}, {
        get: (_, n) => {
            return engine[n];
        },
        set: (_, n) => {
            throw `Cannot assign to read only property '${n}'`;
        }
    });
};

/**
 * @returns {Promise<LoaderResult>}
 */
export const getLoaderData = async (context) => {
    const engine = getDedupeLoaderData();

    if (context === RootLoaderContext) {
        engine.has_root = true;
    }

    try {
        const fallback = [engine.promise];

        if (!engine.has_root && !engine.has_install) {
            fallback.push(
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (engine.has_install) {
                            engine.promise
                                .then(resolve)
                                .catch(reject);
                        } else {
                            installLoaderData({ stopRedirection: true, ignoreSettle: true })
                                .then(resolve)
                                .catch(reject);
                        }
                    }, 0);
                })
            );
        }

        const result = await Promise.race(fallback);
        return result;
    } catch (error) {
        if (context === RootLoaderContext) {
            return installLoaderData({ stopRedirection: true, ignoreSettle: true });
        }

        throw error;
    }
};

/**
 * @typedef {object} LoaderResult
 * @property {{ data: {}, value?: string | undefined, name: string, query?: string | undefined }} [locale]
 * @property {{}} [main_locale]
 * @property {boolean} [isbot]
 * @property {import("mosquito-transport-js").AuthData | undefined} [user]
 * @property {{} | undefined} [userData]
 * @property {{} | undefined} [userConfig]
 * @property {string} [ip_address]
 * @property {string | undefined} [machineCode]
 * @property {string | undefined} [session_lang]
 * @property {string | undefined} [timezone]
 * @property {any} [params]
 * @property {{ init_dark: boolean, value?: string | undefined, query?: string | undefined }} [theme_config]
 * @property {{ ipcity?: string, ipcontinent?: string, ipcountry?: string, iplatitude?: string, iplongitude?: string, region?: string, region_code?: string, timezone?: string }} [geo]
 * @property {import("next/dist/server/web/spec-extension/adapters/headers").ReadonlyHeaders} [header]
 * @property {URL} [url_instance]
 */

/**
 * @param {{lang: string, pathname: string, searchParams?: URLSearchParams, params: {[key: string]: string}, enforceUser?: boolean, stopRedirection?: boolean, preventUnverifiedAuth?: boolean }} options 
 * 
 * @returns {Promise<LoaderResult>}
 */
export const installLoaderData = async (options) => {
    const engine = getDedupeLoaderData();

    if (!options.ignoreSettle) {
        engine.has_install = true;
    }

    try {
        console.log('loader:', options.pathname);
        const anchorLang = (options.params = await options.params)?.lang;

        if (anchorLang && !SUPPORTED_LANGUAGES[anchorLang]) {
            notFound();
        }

        const [headerData, cookiesData] = await Promise.all([headers(), cookies()]);
        const userAgent = headerData.get('user-agent');
        const atoken = cookiesData.get('atoken')?.value;
        const rtoken = cookiesData.get('rtoken')?.value;
        const machineCode = cookiesData.get('mcode')?.value;
        const timezone = cookiesData.get('tz')?.value;
        const session_lang = cookiesData.get('lang')?.value;
        const req_country = headerData.get('CF-IPCountry');
        const req_timezone = headerData.get('CF-Timezone');
        const isRobot = isbot(userAgent);
        const thisBot = isRobot || process.env.NODE_ENV === 'development';

        let userObj;

        try {
            if (atoken && rtoken)
                userObj = await executeMserver(async ({ mserver, info: { atoken, rtoken }, DbPath }) => {
                    const [user, ruser] = await Promise.all([
                        mserver.verifyToken(atoken),
                        mserver.validateToken(rtoken, true)
                    ]);
                    if (user.uid !== ruser.uid) throw 'token uid mismatch';
                    if (user.entityOf !== ruser.tokenID) throw 'token entity mismatch';

                    const [userData, userConfig] = await Promise.all([
                        mserver.db.collection(DbPath.users).findOne({ _id: user.uid }),
                        mserver.db.collection(DbPath.prefferedSettings).findOne({ _id: user.uid })
                    ]);

                    return { user, userData, userConfig };
                }, { atoken, rtoken });
        } catch (error) {
            console.error('userObj:', error, ' tokens:', { atoken, rtoken });
            if (`${error}` === 'TypeError: fetch failed')
                throw "We're experiencing a temporary issue connecting to our core infrastructure. Please retry in a few minutes";
        }

        if (anchorLang) {
            if (!options.pathname?.startsWith?.(`/${anchorLang}`)) {
                options.pathname = `/${anchorLang}${options.pathname || ''}`;
            }
        }

        const url_instance = new URL(options.pathname || '', process.env.NEXT_PUBLIC_WEB_BASE_URL);

        if (options.searchParams) {
            Object.entries((await options.searchParams) || {}).forEach(([k, v]) => {
                url_instance.searchParams.set(k, v);
            });
        }

        const doRedirect = path =>
            redirect(`/${path}?redirect=${encodeURIComponent(`${url_instance.pathname || ''}${url_instance.search || ''}`)}`, 'push');
        const thisUser = userObj?.user;

        const queryTheme = shouldBe(url_instance.searchParams.get('theme'), ['light', 'dark']);
        const queryLang = shouldBe(url_instance.searchParams.get('lang'), SUPPORTED_LANGUAGES_LIST);

        if (options.stopRedirection) {
            if (options.preventUnverifiedAuth && thisUser && !thisUser.authVerified) {
                doRedirect('verification');
            }
        } else {
            const undoRedirection = (shouldStripLang = true) => {
                const redoUrl = decodeURIComponent(url_instance.searchParams.get('redirect') || '');

                if (redoUrl) {
                    redirect(shouldStripLang ? stripLangFromUrl(redoUrl) : redoUrl, 'replace');
                } else redirect('/', 'replace');
            }

            if (thisUser) {
                if (thisUser.disabled) {
                    if (url_instance.pathname !== '/suspended') {
                        doRedirect('suspended');
                    }
                } else {
                    if (url_instance.pathname === '/suspended') {
                        undoRedirection();
                    } else if (thisUser.authVerified) {
                        if (url_instance.pathname === '/verification') {
                            undoRedirection();
                        }
                    } else {
                        if (url_instance.pathname !== '/verification') {
                            doRedirect('verification');
                        }
                    }
                }
            }

            if (options?.enforceUser && !thisUser) {
                unauthorized();
            }
        }

        let countryLang;

        const langValue = queryLang || anchorLang || (userObj ? userObj?.userConfig?.locale : (session_lang || (thisBot ? 'en' : undefined)));

        const prefferLang = langValue || (SUPPORTED_LANGUAGES[countryLang = getCountryLangs(req_country)?.[0]] ? countryLang : 'en');

        const userTheme = queryTheme || userObj?.userConfig?.theme;
        const [commomLocale, mainLocale] = getLocales(prefferLang, options.lang);

        const result = {
            ...userObj,
            isbot: thisBot,
            ip_address: headerData.get(process.env.IP_NODE) || process.env.DEV_PUBLIC_IP_ADDRESS,
            url_instance,
            locale: {
                data: { ...commomLocale, ...mainLocale },
                value: langValue,
                name: prefferLang,
                query: queryLang
            },
            main_locale: mainLocale,
            theme_config: {
                init_dark: userTheme ? userTheme === 'dark' : !getThemeDateContext(timezone, req_timezone).isDayLight,
                value: userTheme,
                query: queryTheme
            },
            geo: {},
            machineCode,
            timezone,
            session_lang,
            params: options.params,
            header: headerData
        };

        [
            'cf-ipcity',
            'cf-ipcontinent',
            'cf-ipcountry',
            'cf-iplatitude',
            'cf-iplongitude',
            'cf-region',
            'cf-region-code',
            'cf-timezone'
        ].forEach(node => {
            const value = headerData.get(node);
            if (value) result.geo[node.startsWith('cf-') ? node.substring('cf-'.length).split('-').join('_') : node] = value;
        });

        if (!options.ignoreSettle) {
            if (engine.settled) {
                throw 'duplicate method call: installLoaderData(...args) should only be called once per page';
            } else {
                engine.settled = true;
                engine.resolve(result);
            }
        }

        return result;
    } catch (error) {
        if (!options.ignoreSettle) {
            if (!engine.settled) {
                engine.settled = true;
                engine.reject(error);
            }
        }

        throw error;
    }
}

export const decodeParams = (params) =>
    params &&
    Object.fromEntries(
        Object.entries(params || {}).map(([k, v]) => [k, decodeURIComponent(v)])
    );

export const normalizeGeo = ({ ipcountry, ipcity, iplatitude, iplongitude } = {}) => ({
    ...ipcountry ? { country: ipcountry } : {},
    ...ipcity ? { city: ipcity } : {},
    ...(iplatitude && iplongitude) ? { ll: [iplatitude * 1, iplongitude * 1] } : {}
});