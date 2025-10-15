import { Alert, Platform, ToastAndroid, useWindowDimensions } from "react-native";
import { simplifyCaughtError } from "simplify-error";

/**
 * @type {(callback: import('react-native').ScrollViewProps['onScroll'], offset: number) => Function}
 */
export const useScrollViewPagination = (callback, offset = 100) => {

    return e => {
        const {
            contentOffset: { y },
            contentSize: { height },
            layoutMeasurement: { height: layHeight }
        } = e.nativeEvent;
        const hasReachDown = y + layHeight + offset >= height;
        if (hasReachDown) callback(e);
    }
};

/**
 * @type {(callback: (index: number) => void, childrenRefs: []) => import('react-native').ScrollViewProps['onScroll']}
 */
export const handleScrollViewChildrenVisibility = (callback, childrenRefs) => {
    return event => {
        const {
            nativeEvent: { contentOffset: { y }, layoutMeasurement: { height } }
        } = event;

        childrenRefs.forEach((e, i) => {
            if (e) {
                e.measureLayout(event.currentTarget, (_, fixedY, _w, itemHeight) => {
                    const isVisible = y >= (fixedY - height) && y <= fixedY + itemHeight;
                    if (isVisible) callback(i);
                });
            }
        });
    };
};

export const shouldCover = ([w1, h1], [w2, h2], threshold = .2) => Math.abs((w1 / h1) - (w2 / h2)) < threshold;

export const useGridSpacing = ({ widthCountMap, spacing, maxWidth }) => {
    const { width, height } = useWindowDimensions();

    const gridCount = widthCountMap.find(v => width <= v[0])?.[1] || widthCountMap.slice(-1)[0][1];
    return {
        width: ((Math.min(maxWidth || width, width) - (spacing * (gridCount + 1))) / gridCount),
        spacing,
        counts: gridCount,
        windowWidth: width,
        windowHeight: height
    };
};

export const showToast = (message, type) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.LONG);
    } else if (Platform.OS === 'ios') {

    }
}

export const alertNull = (locales, isDarkMode, title, message, onPress, dismissTxt, cancelable, onDismiss) => {
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
            userInterfaceStyle: isDarkMode ? 'dark' : 'light',
            cancelable: cancelable === undefined ? !onPress : cancelable,
            onDismiss: doDismiss
        }
    );
}

export const alertDialog = (locales, isDarkMode, title, message, onYesPress, onNoPress, yesTxt, noTxt, cancelable, onDismiss, maybeOnpress, maybeTxt) => {
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
            userInterfaceStyle: isDarkMode ? 'dark' : 'light',
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

export const alertError = (locales, e) => {
    const { error, message } = simplifyCaughtError(e).simpleError;
    alertNull(
        locales?.[error] || error,
        locales?.[message] || message
    );
};