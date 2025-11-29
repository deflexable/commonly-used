import { Image, Share, TouchableOpacity, View } from "react-native";
import { AppTitleBar, commonAppBarStyle } from "./AppBars";
import { themeStyle } from "../page_helper";
import { Back, Plus, Refresh } from "@this_app_root/src/utils/assets";
import TextView from "./TextView";
import { Colors } from "@this_app_root/src/utils/values.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { WebView } from 'react-native-webview';
import Clipboard from "@react-native-clipboard/clipboard";
import { useDarkMode } from "../theme_helper.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackButton } from "react-native-push-back";
import { useCustomStyle } from "../styling.js";
import { getColorLuminance } from "../../common/color_status";

export default function ({
    navigation,
    route: {
        params: {
            uri,
            onDestroy,
            onHref,
            forceTheme,
            webProps,
            useDocumentEvent
        }
    }
}) {
    const insets = useSafeAreaInsets();
    const defaultDarkMode = useDarkMode();

    const [documentMessage, setDocumentMessage] = useState();
    const [webTitle, setWebTitle] = useState();
    const [href, setHref] = useState(uri);
    const [loadProgress, setLoadProgress] = useState(0);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [pageDark, setPageDark] = useState();
    const [baseTheme, setBaseTheme] = useState();
    // const [loading, setLoading] = useState();

    const loading = loadProgress < 1;
    const webviewRef = useRef();
    const awaitingTasks = useRef({});
    const taskIterator = useRef(0);

    const isDarkMode = forceTheme ? (forceTheme === 'dark') : pageDark === undefined ? defaultDarkMode : pageDark;
    const styles = useCustomStyle(styling, { prioritiseMap: [isDarkMode ? 'dark' : 'light'] }).styles;

    const {
        doBottomSpacing,
        tabbarColor = baseTheme,
        doTabbar,
        doTitleContent,
        tabbarTint,
        subTxtTint
    } = useDocumentEvent?.(documentMessage, { styles, isDarkMode, insets, href }) || {};

    const pressBackBtn = useBackButton(() => {
        if (canGoBack) {
            webviewRef.current.goBack()
        } else navigation.goBack();
    });

    const addWebviewTask = (ref, script, timeout = 15_000) => new Promise((resolve, reject) => {
        const taskTimeout = setTimeout(() => {
            awaitingTasks.current[ref]({ error: 'task timeout' });
        }, timeout);
        awaitingTasks.current[ref] = (response) => {
            clearTimeout(taskTimeout);
            if (ref in awaitingTasks.current) delete awaitingTasks.current[ref];
            const { error, data } = response;
            if (error) reject(error);
            else resolve(data);
        }
        webviewRef.current.injectJavaScript(script);
    });

    useEffect(() => onDestroy, []);

    useEffect(() => {
        onHref?.(href);
    }, [href]);

    useEffect(() => {
        computeWindowTheme();
    }, [href, loadProgress]);

    const computeWindowTheme = async () => {
        try {
            const { domColor, bodyColor, barColor, ignore } = await getWindowColoring();
            if (ignore) return;

            console.log('computeWindowTheme res:', { domColor, bodyColor, barColor });
            try {
                const baseColor = bodyColor || (domColor === 'rgba(0, 0, 0, 0)' ? undefined : domColor);

                const { status } = getColorLuminance(baseColor);
                setPageDark(status === 'too_dark');
            } catch (_) {
                try {
                    const { status } = getColorLuminance(barColor);
                    if (status === 'normal_brightness') {
                        setPageDark();
                    } else setPageDark(status === 'too_dark');
                } catch (_) {
                    setPageDark();
                }
            }
            setBaseTheme(barColor);
        } catch (error) {
            console.log('computeWindowTheme err:', error);
            setBaseTheme();
            setPageDark();
        }
    }

    const getWindowColoring = () => {
        const ref = ++taskIterator.current;

        const script = `
        (() => {
            const ref = ${ref};
            let domColor;
            let bodyColor;
            let barColor;

            try {
                bodyColor = window.getComputedStyle(document.querySelector('body')).backgroundColor;
            } catch (_) { }

            try {
                domColor = window.getComputedStyle(document.querySelector('html')).backgroundColor;
            } catch (_) { }

            try {
                barColor = document.head.querySelector('meta[name="theme-color"]').content;
            } catch (_) { }

            window.ReactNativeWebView.postMessage(JSON.stringify({ ref, data: { barColor, domColor, bodyColor } }));
        })();
        `;
        return addWebviewTask(ref, script).catch(e => {
            if (ref === taskIterator.current) throw e;
            return { ignore: true };
        });
    }

    const tabbarRightBtnImg = useMemo(() => ([
        styles.titleBarIcon,
        loading ? { transform: [{ rotate: '45deg' }] } : undefined
    ]), [loading, styles.titleBarIcon]);

    const renderTitleBar = () =>
        doTabbar ? doTabbar?.() : (
            <AppTitleBar
                backgroundColor={tabbarColor || styles.tabbarBG.backgroundColor}
                leading={
                    <TouchableOpacity
                        style={styles.tabbarBtnLeft}
                        onPress={pressBackBtn}>
                        <Image
                            tintColor={tabbarTint}
                            style={styles.titleBarIcon}
                            source={Back}
                        />
                    </TouchableOpacity>
                }
                center={true}
                title={
                    doTitleContent ?
                        doTitleContent?.() :
                        <TouchableOpacity
                            style={styles.barCenterCon}
                            onPress={() => {
                                Share.share({ title: webTitle, url: href, message: href });
                            }}
                            onLongPress={() => {
                                Clipboard.setString(href);
                            }}>
                            <TextView
                                numberOfLines={1}
                                style={styles.screenTitle}
                                forceColor={tabbarTint}>
                                {webTitle || ' '}
                            </TextView>
                            <TextView
                                numberOfLines={1}
                                style={styles.screenSubTitle}
                                forceColor={subTxtTint}>
                                {href || ' '}
                            </TextView>
                        </TouchableOpacity>
                }
                trailing={
                    loading === undefined ? null :
                        <TouchableOpacity
                            style={styles.tabbarBtnRight}
                            onPress={() => {
                                if (loading) {
                                    webviewRef.current.stopLoading();
                                } else webviewRef.current.reload();
                            }}>
                            <Image
                                tintColor={tabbarTint}
                                style={tabbarRightBtnImg}
                                source={loading ? Plus : Refresh}
                            />
                        </TouchableOpacity>
                }
            />
        );

    return (
        <View style={styles.main}>
            {renderTitleBar()}
            <View style={styles.flexer}>
                <WebView
                    {...webProps}
                    ref={webviewRef}
                    style={styles.flexer}
                    source={{ uri }}
                    cacheEnabled
                    originWhitelist={['*']}
                    allowsInlineMediaPlayback
                    forceDarkOn={isDarkMode}
                    onLoadEnd={computeWindowTheme}
                    onMessage={message => {
                        // console.log('onMessage:', message.nativeEvent.data);
                        try {
                            const { ref, ...rest } = JSON.parse(message.nativeEvent.data);
                            awaitingTasks.current[ref](rest);
                        } catch (_) { }
                        setDocumentMessage?.(message.nativeEvent.data);
                    }}
                    onLoadProgress={({ nativeEvent }) => {
                        setHref(nativeEvent.url);
                        setWebTitle(nativeEvent.title);
                        setLoadProgress(nativeEvent.progress || 0);
                        setCanGoBack(nativeEvent.canGoBack);
                        setCanGoForward(nativeEvent.canGoForward);
                        // setLoading(nativeEvent.loading);
                        console.log('web progress:', nativeEvent);
                    }}
                />
                {/* {loading ?
                    <LoadingOverlay size={40} /> : null} */}
                {loadProgress === 1
                    ? null :
                    <View
                        style={{
                            height: 3,
                            width: `${Math.round(loadProgress * 100)}%`,
                            backgroundColor: Colors.goodOrange,
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }} />}
            </View>
            {doBottomSpacing?.()}
        </View>
    );
};

const styling = {
    ...commonAppBarStyle,

    tabbarBG: {
        backgroundColor: themeStyle(Colors.white, Colors.dark)
    },

    barCenterCon: { marginHorizontal: 5 },

    screenTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        color: themeStyle(Colors.dark, Colors.white)
    },

    screenSubTitle: {
        fontSize: 11,
        textAlign: 'center',
        color: themeStyle(Colors.gray, Colors.white70Opacity),
        marginTop: 3
    }
};