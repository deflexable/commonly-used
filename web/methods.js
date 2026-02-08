import { useEffect, useRef, useState } from "react";
import { useLastLoaderData } from "./nav.js";
import { ListenersKey } from "website/app/utils/listeners";
import { CentralizeListener } from "./listeners";
import { isBrowser } from "./is_browser.js";
import { WEB_SCOPE } from "./scope.js";

export const getTimezoneOffset = (tz) => {
    if (!tz) return 0;
    const tzTime = new Date(new Date().toLocaleString("en", { timeZone: tz })).getTime(),
        clientTime = Date.now();

    return tzTime - clientTime;
};

export const appendScriptSrc = (obj) => new Promise((resolve, reject) => {
    if (typeof obj === 'string') obj = { src: obj };

    if (isBrowser() && obj?.src) {
        if (!document.head.querySelector(`script[src="${obj.src}"]`)) {
            const scriptNode = document.createElement('script');

            Object.entries(obj).forEach(([key, value]) => {
                scriptNode[key] = value;
            });

            scriptNode.onload = () => {
                resolve();
            }

            scriptNode.onerror = () => {
                reject();
            }

            document.head.appendChild(scriptNode);
        } else resolve();
    }
});

export const removeScriptSrc = (obj) => {
    if (typeof obj === 'string') obj = { src: obj };

    if (isBrowser() && obj?.src) {
        document.head.querySelector(`script[src="${obj.src}"]`)?.remove?.();
    }
};

export const useScriptSrc = ({ src, onerror, onsuccess }) => {
    const [state, setState] = useState({ success: undefined, error: undefined });

    useEffect(() => {
        let hasUnmounted;

        appendScriptSrc(src).then(s => {
            if (hasUnmounted) return;
            onsuccess(s);
            setState({ success: true });
        }, e => {
            if (hasUnmounted) return;
            onerror(e);
            setState({ error: true });
        });

        return () => {
            hasUnmounted = true;
            removeScriptSrc(src);
        }
    }, []);

    return state;
};

export const usePrefferedSettings = () => {
    const { userSettings } = useLastLoaderData();
    const [prefferedSettings, setPrefferedSettings] = useState({ ...userSettings });

    useEffect(() => {
        return CentralizeListener.listenTo(ListenersKey.PREFFED_SETTINGS, l => {
            setPrefferedSettings({ ...l });
        });
    }, []);

    return prefferedSettings;
}

export const downloadBuffer = ({ data, href, type = "text/plain", rename }) => {
    const a = document.createElement("a");
    let url;

    if (href) {
        a.href = href
    } else {
        url = (data instanceof Blob) ? URL.createObjectURL(data) : URL.createObjectURL(new Blob([data], { type }));
        a.href = url;
    }
    a.setAttribute("download", rename);
    if (href) a.target = '_blank';
    document.body.appendChild(a);
    a.click();

    if (url) URL.revokeObjectURL(url)
    document.body.removeChild(a);
};

export const listenLazyScroll = (callback, selector, offSet = 200) => {
    if (!selector) {
        const l = function () {
            if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - offSet))
                callback();
        };

        window.addEventListener('scroll', l);
        return () => {
            window.removeEventListener('scroll', l);
        }
    } else {
        const a = (Array.isArray(selector) ? selector : [selector]).map(ref => {
            const l = function () {
                const { scrollTop, scrollHeight, clientHeight } = document.querySelector(ref) || {};

                if (scrollTop >= (scrollHeight - clientHeight - offSet)) {
                    callback?.();
                }
            }

            const ele = document.querySelector(ref);
            if (ele) {
                ele.addEventListener('scroll', l);
                l();
                return [ele, l];
            }
            return [];
        });
        return () => {
            a.forEach(([ele, l]) => {
                if (ele) ele.removeEventListener('scroll', l);
            });
        }
    }
};

export const useLazyScroll = (callback, selector, offset) => {
    const instantCallback = useRef();
    instantCallback.current = callback;

    useEffect(() => {
        return listenLazyScroll(() => { instantCallback.current() }, selector, offset);
    }, [selector, offset]);

    return undefined;
}

export const useBodyLazyScroll = (callback) => {
    const instantCallback = useRef();
    instantCallback.current = callback;

    useEffect(() => {

        const footerElem = document.getElementById('footer-con-id');
        if (footerElem) {
            let lastHeight, lazyL;
            const l = new ResizeObserver(r => {
                const h = r[0].contentRect.height;
                if (typeof h === 'number' && !isNaN(h)) {
                    if (lastHeight !== h) {
                        lazyL?.();
                        lazyL = listenLazyScroll(() => {
                            instantCallback.current();
                        }, undefined, 200 + h);
                    }
                    lastHeight = h;
                }
            });
            l.observe(footerElem);

            return () => {
                l.disconnect();
                lazyL?.();
            }
        } else {
            return listenLazyScroll(() => {
                instantCallback.current();
            }, undefined, 250);
        }
    }, []);

    return undefined;
};

export const useBodyScrollBlocker = (block) => {

    useEffect(() => {
        try {
            if (!block) {
                if (!WEB_SCOPE.__scrollBlocker)
                    document.body.classList.remove('body-scroll-y-blocker');
                return;
            }
            ++WEB_SCOPE.__scrollBlocker;

            document.body.classList.add('body-scroll-y-blocker');
            return () => {
                if (!--WEB_SCOPE.__scrollBlocker)
                    document.body.classList.remove('body-scroll-y-blocker');
            };
        } catch (e) {
            console.error('useBodyScrollBlocker err:', e);
        }
    }, [!!block]);
};

export const useDisableBackButton = (callback, enabled = true) => {
    const hasMounted = useRef(),
        hashReducer = useRef(),
        instantCallback = useRef();
    instantCallback.current = callback;

    useEffect(() => {
        if (!enabled) return;
        const _hash = "!";

        const initialScrollY = window.scrollY;
        let hasResetScroll, resetTimer;
        const resetScroll = () => {
            clearTimeout(resetTimer);
            if (!hasResetScroll) window.scroll({ top: initialScrollY, behavior: 'instant' });
            hasResetScroll = true;
        };
        resetTimer = setTimeout(resetScroll, 300);

        const hashChangeListener = function () {
            if (window.location.hash !== _hash) window.location.hash = _hash;
            if (hasMounted.current) {
                clearTimeout(hashReducer.current);
                hashReducer.current = setTimeout(() => {
                    instantCallback.current?.();
                }, 70);
            }
            hasMounted.current = true;
            resetScroll();
        };

        window.location.hash = '#!';

        const keydownListener = () => {
            // var elm = e.target.nodeName.toLowerCase();
            // if (e.which === 8 && (elm !== 'input' && elm !== 'textarea'))
            //     e.preventDefault();
        };
        document.body.addEventListener('keydown', keydownListener);
        window.addEventListener('hashchange', hashChangeListener);

        return () => {
            window.removeEventListener('hashchange', hashChangeListener);
            document.body.removeEventListener('keydown', keydownListener);
        }
    }, [enabled]);

    return callback;
};

export const getImageRect = (file, options) => new Promise(async (resolve, reject) => {
    try {
        const { base64 } = options || {};
        const img = new Image();
        let width, height, src = base64 || await fileToBase64(file);

        await new Promise((resolve, reject) => {
            const clearListener = () => {
                img.onload = null;
                img.onerror = null;
            };

            img.onload = () => {
                width = img.naturalWidth;
                height = img.naturalHeight;
                clearListener();
                resolve();
            };

            img.onerror = () => {
                clearListener();
                reject();
            };
            img.src = src;
        });

        if (isNaN(width) || isNaN(height)) throw new Error('Invalid image');
        resolve([width, height, src]);
    } catch (e) {
        reject(e);
    }
});

export const fileToBase64 = (file) => new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = r => {
        resolve(r.target.result);
    };

    reader.onerror = e => {
        reject(e.target.error);
    };

    reader.readAsDataURL(file);
});