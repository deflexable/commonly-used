"use client"

import "../client_server";
import { deserializeStorage, serializeStorage, SSO_Resolution } from "../cacher";
import { isBrowser } from "../is_browser";
import { useEffect, useRef } from "react";
import { onUserThemeChanged, useDarkMode } from "../theme_helper";
import { appendScriptSrc, updateCookie } from "../methods.client";
import { auth } from "../client_server";
import { getAnalytics, logEvent, setUserId } from "firebase/analytics";
import { one_day } from "../../common/timing";
import { randomString, wait } from "../../common/methods";
import { AuthScope, WEB_STATE } from "../scope";
import { listenUserConfig } from "../setting_syncer";
import { Thumbmark } from "@thumbmarkjs/thumbmarkjs";
import { usePathname } from "next/navigation";
import { isLangRoute, stripLangFromUrl } from "../methods.dual";
import { CONFIG_STATE } from "./state";

if (isBrowser()) {
    if (!WEB_STATE.hasReleaseMosquitoCache) {
        WEB_STATE.hasReleaseMosquitoCache = true;

        const ssoMountedListener = function (event) {
            if (
                event.origin === process.env.NEXT_PUBLIC_SSO_AUTH_URL &&
                event.data.__signal_mounted
            ) {
                SSO_Resolution.callback?.();
                window.removeEventListener('message', ssoMountedListener);
            }
        }
        window.addEventListener('message', ssoMountedListener);
    }
}

export function configureSSO({ firebase }) {
    CONFIG_STATE.FIREBASE_APP = firebase;
}

export default function SSOClient({ serverTime, theme_config, timezone, machineCode, userId, userEntity, userTokenId, userConfig, ignoreRouteReloads = [], geo, onShouldDisableAutoLogin }) {
    const isDarkMode = useDarkMode(theme_config);
    const pathname = usePathname();

    const shouldIgnoreReloads = useRef();
    shouldIgnoreReloads.current = ignoreRouteReloads.some(v => typeof v === 'function' ? v(pathname) : v === pathname);

    const disableAutoSignIn =
        onShouldDisableAutoLogin?.(pathname) ||
        ['/email_validation/', '/pay/', '/override_password/'].some(v => pathname.startsWith(v)) ||
        ['/auth', '/reset-password'].some(v => isLangRoute(v, pathname)) ||
        ['/auth', '/reset-password', '/verification', '/suspended'].includes(pathname);

    if (isBrowser()) {
        WEB_STATE.serverTimeOffset = serverTime - Date.now();
        WEB_STATE.prefferedSettingsValue = userConfig;
        AuthScope.uid = userId;
        AuthScope.geo = geo;
        AuthScope.machine =
            machineCode ?
                Promise.resolve(machineCode) :
                new Thumbmark().get().then(res => {
                    updateCookie('mcode', res.thumbmark);
                    return res.thumbmark;
                }).catch(e => {
                    console.error('thumbmark err:', e);
                    const mcode = randomString(30);
                    updateCookie('mcode', mcode);
                    return mcode;
                });
    }

    useEffect(() => {
        const iframe = document.getElementById('sso-auth-iframe');
        if (iframe) iframe.contentWindow.postMessage({ __check_ready: true }, '*');

        if (!userId) onUserThemeChanged(theme_config.value);

        const thisTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone !== thisTZ) {
            updateCookie('tz', thisTZ || null);
        }
        doAutoGoogleSignIn();

        return listenAuth();
    }, []);

    const listenAuth = () => {
        let lastEntity = userEntity || null;
        let lastTokenId = userTokenId || null;

        const authTokenListener = auth().listenAuthToken(async token => {
            AuthScope.token = token;
            const tokenData = token && auth().parseToken(token);
            const thisEntity = tokenData?.entityOf || null;
            const thisTokenId = tokenData?.tokenID || null;

            const enableReload =
                !['/email_validation/', '/pay/'].some(v => location.pathname.startsWith(v)) &&
                !shouldIgnoreReloads.current;

            if (lastEntity === thisEntity) {
                if (lastTokenId !== thisTokenId) {
                    await updateCookie('atoken', token);
                }
            } else {
                await updateCookie('atoken', token, 'rtoken', await auth().getRefreshToken());
                if (
                    thisEntity && (
                        ['/auth'].includes(location.pathname) ||
                        ['/auth'].some(v => isLangRoute(v, location.pathname)) ||
                        ['/override_password/'].some(v => location.pathname.startsWith(v))
                    )
                ) {
                    const url_instance = new URL(location.href);
                    const redoUrl = stripLangFromUrl(decodeURIComponent(url_instance.searchParams.get('redirect') || ''));

                    if (enableReload) location.href = redoUrl || '/';
                } else if (enableReload) {
                    location.reload();
                }
                return;
            }

            if (tokenData && enableReload) {
                if (tokenData.disabled) {
                    if (location.pathname !== '/suspended') {
                        location.reload();
                    }
                } else {
                    if (location.pathname === '/suspended') {
                        location.reload();
                    } else if (tokenData.authVerified) {
                        if (location.pathname === '/verification') {
                            location.reload();
                        }
                    } else {
                        if (location.pathname !== '/verification') {
                            location.reload();
                        }
                    }
                }
            }
            lastEntity = thisEntity;
            lastTokenId = thisTokenId;
        });

        let settingsListener;
        const authListener = auth().listenAuth(user => {
            AuthScope.uid = user?.uid;
            console.log('currentUser: ', user?.uid, ' machineCode: ', machineCode);
            settingsListener?.();

            setUserId(getAnalytics(CONFIG_STATE.FIREBASE_APP), user?.uid || null);
            if (!user || !user.authVerified) return;
            settingsListener = listenUserConfig();
        });

        return () => {
            authTokenListener?.();
            authListener?.();
            settingsListener?.();
        }
    }

    const doAutoGoogleSignIn = async () => {
        if (disableAutoSignIn) return;
        const lastDate = ((await deserializeStorage('AUTO_GOOGLE_SIGNIN')) || 0) * 1;

        if ((!lastDate || (Date.now() - one_day >= lastDate)) && !(await auth().getAuth())) {
            await wait(4000);
        } else return;

        await appendScriptSrc({ src: 'https://accounts.google.com/gsi/client', async: true, defer: true });

        google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID,
            callback: async response => {
                console.log('onSuccess: ', response);
                if (response?.credential) {
                    const user = await auth().googleSignin(response.credential);
                    logEvent(getAnalytics(CONFIG_STATE.FIREBASE_APP), user.isNewUser ? 'sign_up' : 'login', {
                        value: 'google_onetap'
                    });
                }
            },
            use_fedcm_for_prompt: false,
            auto_select: true
        });
        google.accounts.id.prompt();
        serializeStorage('AUTO_GOOGLE_SIGNIN', `${Date.now()}`);
    }

    useEffect(() => {
        const body = document.body;
        const themeColor = document.head.querySelector('meta[name="theme-color"]');

        console.log('isDarkMode:', isDarkMode);
        // Toggle the dark mode class
        if (isDarkMode) {
            body.classList.replace('light_mode_body', 'dark_mode_body');
            document.documentElement.style.setProperty('color-scheme', 'dark');
            document.documentElement.setAttribute('theme-color', 'black');
            themeColor.setAttribute('content', 'black');
        } else {
            body.classList.replace('dark_mode_body', 'light_mode_body');
            document.documentElement.style.setProperty('color-scheme', 'light');
            themeColor.setAttribute('content', 'white');
        }
    }, [isDarkMode]);

    return null;
}