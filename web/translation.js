import { useEffect, useRef, useState } from "react";
import { ListenersKey } from "website/app/utils/listeners";
import { CentralizeListener } from "bbx-commonly-used/web/listeners";
import { ENV } from "bbx-commonly-used/web/server_variables";
import { useLastLoaderData } from "bbx-commonly-used/web/nav.js";
import { DbPath } from "core/common_values";
import { collection, useIsOnline } from "bbx-commonly-used/web/client_server";
import { usePrefferedSettings } from "bbx-commonly-used/web/methods.js";
import { LANG_SCOPE, AuthScope } from "bbx-commonly-used/web/scope.js";

export const LANG_STORE = new Proxy({}, {
    get: (_, n) => globalThis.lang_store[n]
});

const LANG_REF = {
    common: 'common'
};

const LANG_URL = (lang, ref) => `${ENV.WEB_BASE_URL}/translations/${ENV.translationHash}/${lang}/${ref}.json`;

export const useTranslation = (reference = LANG_REF.common, isSecondary) => {
    const { country_lang, force_lang, session_lang, user, must_lang } = useLastLoaderData();
    const { locale } = usePrefferedSettings();

    const instant_session_lang =
        (LANG_SCOPE.session_lang === undefined ? session_lang : LANG_SCOPE.session_lang);

    const langValue = must_lang || force_lang || (user ? locale : instant_session_lang);
    const lang = must_lang || langValue || instant_session_lang || country_lang || 'en';

    const [readyLang, setReadyLang] = useState(lang);
    const [__, reloadState] = useState();

    const loadingLangs = useRef([]),
        instantLang = useRef(),
        mountedMetas = useRef();
    const isOnline = useIsOnline();

    instantLang.current = lang;

    useEffect(() => {
        if (reference !== LANG_REF.common && !isSecondary)
            return CentralizeListener.listenTo(ListenersKey.SESSION_LANG, () => {
                reloadState({});
            });
    }, []);

    useEffect(() => {
        if (must_lang) return;
        if (reference !== LANG_REF.common && !isSecondary && mountedMetas.current) {
            const { meta_title } = LANG_STORE[readyLang][reference];
            if (meta_title) document.title = `${meta_title} - ${ENV.APP_NAME}`;
        }
        mountedMetas.current = true;
    }, [readyLang]);

    useEffect(() => {
        if (must_lang) return;
        if (lang) {
            if (LANG_STORE?.[lang]?.[reference]) {
                setReadyLang(lang);
                return;
            }

            if (reference === 'common' || isSecondary || loadingLangs.current.includes(lang)) {
                const l = CentralizeListener.listenTo(ListenersKey.COMMON_TRANSLATION, () => {
                    if (LANG_STORE?.[lang]?.[reference]) {
                        if (lang === instantLang.current) setReadyLang(lang);
                        l();
                    }
                });
                return l;
            }

            loadingLangs.current.push(lang);
            (async () => {
                try {
                    const [json, common] = await Promise.all([
                        fetch(LANG_URL(lang, reference), { cache: 'force-cache' }),
                        fetch(LANG_URL(lang, LANG_REF.common), { cache: 'force-cache' })
                    ]).then(v => Promise.all(v.map(async r => await r.json())));
                    // if (ENV.IS_DEV) await wait(4000);
                    if (!globalThis.lang_store[lang]) globalThis.lang_store[lang] = {};
                    globalThis.lang_store[lang][reference] = json;
                    globalThis.lang_store[lang].common = common;
                    CentralizeListener.dispatch(ListenersKey.COMMON_TRANSLATION);
                    if (instantLang.current === lang) setReadyLang(lang);
                } catch (e) {
                    console.error('loading lang err:', e);
                }
                loadingLangs.current = loadingLangs.current.filter(v => v !== lang);
            })();
        }
    }, [lang, isOnline]);

    return {
        lang,
        langValue: langValue || 'auto',
        common: LANG_STORE[readyLang].common,
        translations: LANG_STORE[readyLang][reference]
    };
};

export const updateLanguage = (value) => {
    const url = new URL(location.href),
        urlLang = url.searchParams.get('lang'),
        isAuto = !value || value === 'auto';

    if (urlLang) {
        if (urlLang === value) return;
        if (isAuto) {
            url.searchParams.delete('lang');
        } else url.searchParams.set('lang', value);
        location.href = url.href;
    } else if (AuthScope.uid) {
        collection(DbPath.prefferedSettings).mergeOne({ _id: AuthScope.uid }, {
            [isAuto ? '$unset' : '$set']: { locale: isAuto || value }
        });
    } else {
        LANG_SCOPE.session_lang = isAuto ? null : value;
        CentralizeListener.dispatch(ListenersKey.SESSION_LANG);
        CentralizeListener.dispatch(ListenersKey.FETCHER_SUBMIT, (fetcher, submissionAction) => {
            const form = new FormData();
            form.set('session_lang', isAuto ? 'null' : value);
            fetcher.submit(form, { method: 'POST', action: submissionAction });
        });
    }
};