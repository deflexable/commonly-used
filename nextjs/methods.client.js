import { useEffect, useRef, useState } from "react";
import { internal_keys, listeners } from "./listeners";
import { WEB_STATE } from "./scope";
import { useRouter } from "next/navigation";

export const updateCookie = (...args) => {
    let command;

    if (args.length === 1) {
        if (Array.isArray(args[0])) {
            command = args[0];
        } else if (typeof args[0] === 'string') {
            command = [[args[0]]];
        } else if (Array.isArray(args[0]?.data)) {
            command = [args[0]];
        } else throw `invalid argument:${JSON.stringify(args)}`;
    } else {
        command = [];
        let offset = 0;

        while (args.length > offset) {
            command.push([args[offset], args[offset + 1]]);
            offset += 2;
        }
    }

    if (process.env.NODE_ENV === 'development')
        command.forEach(e => {
            console.warn('updating cookies:', e);
        });

    return fetch(`${process.env.NEXT_PUBLIC_WEB_BASE_URL}/api/cookie`, {
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(command)
    }).then(async r => {
        const res = await r.json();
        if (res.error) throw res.error;
        if (!res.success) throw `failed to update cookie of command:${JSON.stringify({ command, args })}`;
        return true;
    });
}

export const getPreciseTime = (defaultOffset) => {
    defaultOffset = defaultOffset ?? WEB_STATE.serverTimeOffset ?? 0;
    return Math.abs(defaultOffset) > 10_000 ? Date.now() + defaultOffset : Date.now();
}

export const appendScriptSrc = (obj) => {
    if (typeof obj === 'string') obj = { src: obj };

    if (obj?.src) {
        if (
            !window.__pending_script_append?.[obj.src] &&
            !document.body.querySelector(`script[src="${obj.src}"]`)
        ) {
            const scriptNode = document.createElement('script');

            if (!window.__pending_script_append)
                window.__pending_script_append = {};

            let success, failure;
            window.__pending_script_append[obj.src] =
                new Promise((resolve, reject) => {
                    success = resolve;
                    failure = reject;
                });

            Object.entries(obj).forEach(([key, value]) => {
                scriptNode[key] = value;
            });

            scriptNode.onload = () => {
                success();
            }

            scriptNode.onerror = () => {
                failure();
            }

            document.body.appendChild(scriptNode);
            console.log('importing ', obj.src);
        }
        return window.__pending_script_append[obj.src];
    } else throw '"src" property is required';
}

export const useScriptSrc = ({ src, onerror, onsuccess }) => {
    const [state, setState] = useState({ success: undefined, error: undefined, loading: true });

    useEffect(() => {
        let hasUnmounted;

        appendScriptSrc(src).then(s => {
            if (hasUnmounted) return;
            setState({ success: true });
            onsuccess?.(s);
        }, e => {
            if (hasUnmounted) return;
            setState({ error: `Error: ${e}` });
            onerror?.(e);
        });

        return () => {
            hasUnmounted = true;
        }
    }, []);

    return state;
};

export const usePrefferedSettings = (init) => {
    const [prefferedSettings, setPrefferedSettings] = useState(() => ({ ...WEB_STATE.prefferedSettingsValue || init }));

    useEffect(() => {
        return listeners.listenTo(internal_keys.PREFFED_SETTINGS, l => {
            setPrefferedSettings({ ...l });
        });
    }, []);

    return prefferedSettings;
};

export const downloadBuffer = ({ data, href, type = "text/plain", rename }) => {
    const a = document.createElement("a");
    let url;

    if (href) {
        a.href = href;
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
            if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - offSet)) {
                callback();
            }
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
        return listenLazyScroll(() => {
            instantCallback.current();
        }, selector, offset);
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

const Identifier = '__BackButtonBlocker_';

export function useBackButton({ callback, disable, onreset }) {
    const router = useRouter();

    const instantCallback = useRef();
    instantCallback.current = callback;

    const onresetInstant = useRef();
    onresetInstant.current = onreset;

    const instantDisable = useRef();
    instantDisable.current = disable;

    const reposition = () => {
        if (instantDisable.current) {
            window.history.pushState({ [Identifier]: true }, "", window.location.pathname);
        } else if (window.history.state?.[Identifier] === undefined) {
            if (onresetInstant.current)
                requestAnimationFrame(() => {
                    onresetInstant.current?.();
                });
        } else router.back();
    }

    useEffect(reposition, [!disable]);

    useEffect(() => {
        const handlePopState = () => {
            if (instantDisable.current)
                instantCallback.current?.();
            reposition();
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    return callback;
}

export const getImageRect = (file, options) =>
    new Promise(async (resolve, reject) => {
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

export const fileToBase64 = (file) =>
    new Promise(async (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = r => {
            resolve(r.target.result);
        };

        reader.onerror = e => {
            reject(e.target.error);
        };

        reader.readAsDataURL(file);
    });