import { Alert, Platform, ToastAndroid, useWindowDimensions } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { simplifyCaughtError } from "simplify-error";
import { ThemeHelperScope } from "./scope";
import { locales } from "./locale";
import { proxyFunction } from "../common/proxy-function.js";
import { useDarkMode } from "./theme_helper";
import { Scope } from "@/src/utils/scope";
import listeners, { EVENT_NAMES } from '@/src/utils/listeners';
import { StandardURL } from "./url_parser.js";
import { IS_DEV, HOST_NAME } from '@/env';

/**
 * auto optimize image quality
 * @param {string} link 
 * @param {{ w?: number, h: number, q: number } | number} opts 
 * @returns {string}
 */
export const optimizeImage = (link = '', opts = 90) => {
    try {
        if (!['https://', 'http://'].some(v => link.startsWith(v)) || link.endsWith('.gif')) return link;
        link = devTransformLocalhostURL(link);
        const q = new URLSearchParams();

        if (Number.isInteger(opts?.w)) q.append('w', `${opts.w}`);
        if (Number.isInteger(opts?.h)) q.append('h', `${opts.h}`);
        if (Number.isInteger(opts)) q.append('w', `${opts}`);

        if (opts?.q === undefined) {
            if (!q.has('w') && !q.has('h')) {
                q.append('q', '0.7');
            }
        } else q.append('q', `${opts.q}`);
        const qValue = q.toString();

        return `${link}${qValue ? '?' + qValue : ''}`;
    } catch (error) {
        return link;
    }
};

export const devTransformLocalhostURL = (url) => {
    if (!url) return url;
    if (IS_DEV && Platform.OS === 'android') {
        try {
            const p = new StandardURL(url);
            if (p.hostname === 'localhost') {
                p.hostname = HOST_NAME;
                return p.href;
            }
        } catch (_) { }
    }
    return url;
};

export const usePrefferedSettings = () => {
    const [prefferedSettings, setPrefferedSettings] = useState({ ...Scope.prefferedSettingsValue });

    useEffect(() => {
        return listeners.listenTo(EVENT_NAMES.prefferedSettings, l => {
            setPrefferedSettings({ ...l });
        });
    }, []);

    return prefferedSettings || {};
};

export const themeStyle = (light, dark) => {
    return (feeder) => feeder.isDarkMode ? dark : light;
};

/**
 * @template T
 * @param {T | Array<T>} styling
 * @param {F} feeder
 * @returns {{ isDarkMode: boolean, styles: T, feeder: F }}
 */
export const useStyle = (styling, feeder) => {
    const isDarkMode = useDarkMode();

    const cache = useMemo(() => new Map(), []);

    return useMemo(() => {
        const thisFeeder = { isDarkMode, feeder };

        if (Array.isArray(styling)) {
            const list = styling.map(v => {
                const result = proxyFunction(v, thisFeeder, true, cache);
                return result.proxable || result.object;
            }).slice(0).reverse();

            return {
                isDarkMode,
                styles:
                    new Proxy({}, {
                        get: (_, p) =>
                            list.find(v => v?.hasOwnProperty?.(p))?.[p],
                        set: (_, p) => {
                            throw `Cannot assign to read only property '${p}'`;
                        }
                    }),
                feeder
            };
        } else {
            const result = proxyFunction(styling, thisFeeder, true, cache);
            return { isDarkMode, styles: result.proxable || result.object, feeder };
        }
    }, [styling, isDarkMode, feeder]);
};

/**
 * @template T
 * @param {T | Array<T>} styling
 * @returns {{ isDarkMode: boolean, styles: T, feeder: import("react-native").ScaledSize }}
 */
export const useScalingStyle = (styling) => {
    const sizing = useWindowDimensions();
    const feeder = useMemo(() => ({ ...sizing }), ['width', 'height', 'fontScale', 'scale'].map(n => sizing[n]));

    return useStyle(styling, feeder);
};

export const shouldCover = ([w1, h1], [w2, h2], threshold = .2) => Math.abs((w1 / h1) - (w2 / h2)) < threshold;

export const createGridSpacing = ({ grid, spacing }) =>
    (viewWidth, maxWidth) => {
        if (typeof maxWidth === 'function') maxWidth = maxWidth(viewWidth);

        const fullWidth = maxWidth ? Math.min(maxWidth, viewWidth) : viewWidth;

        const gridCount = grid.find(v => fullWidth <= v[0])?.[1] || grid.slice(-1)[0][1];

        return {
            width: ((fullWidth - (spacing * (gridCount + 1))) / gridCount),
            spacing,
            counts: gridCount
        };
    };

export const useGridSpacing = ({ grid, spacing, maxWidth, forceCheck }) => {
    const dim = useWindowDimensions();

    return useMemo(() => {
        return createGridSpacing({ grid, spacing })(dim.width, maxWidth);
    }, [spacing, dim.width, ...forceCheck ? [grid, maxWidth] : typeof maxWidth === 'function' ? [] : [maxWidth]]);
}

export const createSegmentList = (list, row) => {
    const segmentList = [];

    if (list) {
        list.forEach(e => {
            if (
                !segmentList.length ||
                segmentList.slice(-1)[0].length >= row
            ) segmentList.push([]);
            segmentList.slice(-1)[0].push(e);
        });
    }
    return segmentList;
};

export const showToast = (message, type) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
    } else if (Platform.OS === 'ios') {

    }
}

export const alertNull = (title, message, onPress, dismissTxt, cancelable, onDismiss) => {
    let hasDismiss;
    const doDismiss = () => {
        if (hasDismiss) return;
        hasDismiss = true;
        onDismiss?.();
    }

    Alert.alert(title, message,
        [{
            text: dismissTxt || locales.ok,
            style: 'cancel',
            onPress: () => {
                if (onPress) onPress();
                doDismiss();
            }
        }],
        {
            userInterfaceStyle: ThemeHelperScope.isDarkMode ? 'dark' : 'light',
            cancelable: cancelable === undefined ? !onPress : cancelable,
            onDismiss: doDismiss
        }
    );
}

export const alertDialog = (title, message, onYesPress, onNoPress, yesTxt, noTxt, cancelable, onDismiss, maybeOnpress, maybeTxt) => {
    let hasDismiss;
    const doDismiss = () => {
        if (hasDismiss) return;
        hasDismiss = true;
        onDismiss?.();
    }

    Alert.alert(
        title,
        message,
        [
            ... (maybeOnpress || maybeTxt) ?
                [{
                    text: maybeTxt || 'Maybe',
                    onPress: () => {
                        maybeOnpress?.();
                        doDismiss();
                    }
                }] : [],
            {
                text: yesTxt || locales.yes,
                onPress: () => {
                    onYesPress?.();
                    doDismiss();
                }
            },
            {
                text: noTxt || locales.no,
                onPress: () => {
                    onNoPress?.();
                    doDismiss();
                },
                style: 'cancel'
            }
        ],
        {
            userInterfaceStyle: ThemeHelperScope.isDarkMode ? 'dark' : 'light',
            cancelable,
            onDismiss: doDismiss
        }
    );
};

export const prefixStoragePath = (path, prefix = 'file:///') => {
    let cleanedPath = path.replace(/^[^/]+:\/{1,3}/, '');

    // Continuously remove any remaining protocol patterns until none are left
    while (/^[^/]+:\/{1,3}/.test(cleanedPath)) {
        cleanedPath = cleanedPath.replace(/^[^/]+:\/{1,3}/, '');
    }

    // Remove any leading slashes after protocol removal
    cleanedPath = cleanedPath.replace(/^\/+/, '');

    return `${prefix}${cleanedPath}`;
};

export function purifyFilepath(filename) {
    if (!filename || typeof filename !== 'string')
        throw `invalid filename:${filename}`;

    // Remove invalid characters for both iOS and Android
    return filename
        .replace(/[/\\?%*:|"<>]/g, '') // Remove forbidden characters
        .trim(); // Remove leading/trailing whitespace
};

export const alertError = (e) => {
    const { error, message } = simplifyCaughtError(e).simpleError;
    alertNull(
        locales[error] || error,
        locales[message] || message
    );
};