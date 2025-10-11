import { useEffect, useRef, useState } from "react";
import { useLastLoaderData } from "./nav";

export const installTranslation = ({
    useOnline,
    usePrefferedSettings,
    LANG_REF,
    LANG_STORE,
    LANG_URL,
    ENV,
    CentralizeListener,
    ListenersKey
}) =>
    (reference = LANG_REF.common, isSecondary) => {
        const { country_lang, server_lang, force_lang, user, must_lang } = useLastLoaderData();
        const { locale } = usePrefferedSettings();

        const langValue = must_lang || force_lang || (user ? locale : server_lang);
        const lang = must_lang || langValue || country_lang || 'en';
        const [readyLang, setReadyLang] = useState(lang);

        const loadingLangs = useRef([]),
            instantLang = useRef(),
            mountedMetas = useRef();
        const isOnline = useOnline();

        instantLang.current = lang;

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