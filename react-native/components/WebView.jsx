import { Image, Share, TouchableOpacity, View, StatusBar } from "react-native";
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
import { useIsFocused } from "@react-navigation/native";
import { KeyboardPlaceholderView } from "react-native-dodge-keyboard";

export default function ({
    navigation,
    route: {
        params: {
            uri,
            onDestroy,
            onHref,
            webProps,
            useDocumentEvent
        }
    }
}) {
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    const [documentMessage, setDocumentMessage] = useState();
    const [webTitle, setWebTitle] = useState();
    const [href, setHref] = useState(uri);
    const [loadProgress, setLoadProgress] = useState(0);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [pageDark, setPageDark] = useState();
    const [barDark, setBarDark] = useState();
    const [barColor, setBarColor] = useState();
    // const [loading, setLoading] = useState();

    const loading = loadProgress < 1;
    const webviewRef = useRef();
    const awaitingTasks = useRef({});
    const taskIterator = useRef(0);

    const defaultDarkMode = useDarkMode();

    const {
        doBottomSpacing,
        tabbarColor = barColor,
        doTabbar,
        doTitleContent,
        tabbarTint,
        subTxtTint,
        forcePageDarkMode,
        forceBarDarkMode
    } = useDocumentEvent?.(documentMessage, { pageDark, barDark, insets, href }) || {};

    const thisPageDark = (forcePageDarkMode ?? (pageDark || barDark)) ?? defaultDarkMode;
    const thisBarDark = (forceBarDarkMode ?? (barDark || pageDark)) ?? defaultDarkMode;

    const pageStyles = useCustomStyle(pageStyling, { prioritiseMap: [thisPageDark ? 'dark' : 'light'] }).styles;
    const barStyles = useCustomStyle(barStyling, { prioritiseMap: [thisBarDark ? 'dark' : 'light'] }).styles;

    const pressBackBtn = useBackButton(() => {
        if (canGoBack) {
            webviewRef.current.goBack()
        } else navigation.goBack();
    }, !isFocused);

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
            let baseColor;

            console.log('computeWindowTheme res:', { domColor, bodyColor, barColor });
            try {
                baseColor = bodyColor || (domColor === 'rgba(0, 0, 0, 0)' ? undefined : domColor);

                const { status } = getColorLuminance(baseColor);
                setPageDark(status === 'too_dark');
            } catch (_) {
                setPageDark();
            }

            setBarColor(barColor);
            try {
                const { status } = getColorLuminance(barColor);
                if (status === 'normal_brightness') {
                    setBarDark();
                } else setBarDark(status === 'too_dark');
            } catch (_) {
                setBarDark();
            }
        } catch (error) {
            console.log('computeWindowTheme err:', error);
            setBarColor();
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

    const tabbarRightBtnImg = useMemo(() => ({
        ...barStyles.titleBarIcon,
        ...loading ? { transform: [{ rotate: '45deg' }] } : undefined,
        ...tabbarTint ? { tintColor: tabbarTint } : {}
    }), [loading, barStyles.titleBarIcon, tabbarTint]);

    const tabbarLeftBtnImg = useMemo(() => ({
        ...barStyles.titleBarIcon,
        ...tabbarTint ? { tintColor: tabbarTint } : {}
    }), [tabbarTint, barStyles.titleBarIcon]);

    const renderTitleBar = () =>
        doTabbar ? doTabbar?.() : (
            <AppTitleBar
                statusTint={false}
                backgroundColor={tabbarColor || barStyles.tabbarBG.backgroundColor}
                leading={
                    <TouchableOpacity
                        style={barStyles.tabbarBtnLeft}
                        onPress={pressBackBtn}>
                        <Image
                            style={tabbarLeftBtnImg}
                            source={Back}
                        />
                    </TouchableOpacity>
                }
                center={true}
                title={
                    doTitleContent ?
                        doTitleContent?.() :
                        <TouchableOpacity
                            style={barStyles.barCenterCon}
                            onPress={() => {
                                Share.share({ title: webTitle, url: href, message: href });
                            }}
                            onLongPress={() => {
                                Clipboard.setString(href);
                            }}>
                            <TextView
                                numberOfLines={1}
                                style={barStyles.screenTitle}
                                forceColor={tabbarTint}>
                                {webTitle || ' '}
                            </TextView>
                            <TextView
                                numberOfLines={1}
                                style={barStyles.screenSubTitle}
                                forceColor={subTxtTint}>
                                {href || ' '}
                            </TextView>
                        </TouchableOpacity>
                }
                trailing={
                    loading === undefined ? null :
                        <TouchableOpacity
                            style={barStyles.tabbarBtnRight}
                            onPress={() => {
                                if (loading) {
                                    webviewRef.current.stopLoading();
                                } else webviewRef.current.reload();
                            }}>
                            <Image
                                style={tabbarRightBtnImg}
                                source={loading ? Plus : Refresh}
                            />
                        </TouchableOpacity>
                }
            />
        );

    return (
        <View style={pageStyles.main}>
            <StatusBar barStyle={thisBarDark ? 'light-content' : 'dark-content'} />
            {renderTitleBar()}
            <View style={pageStyles.flexer}>
                <WebView
                    {...webProps}
                    ref={webviewRef}
                    style={pageStyles.flexer}
                    source={{ uri }}
                    cacheEnabled
                    originWhitelist={['*']}
                    allowsInlineMediaPlayback
                    forceDarkOn={thisPageDark}
                    onLoadEnd={computeWindowTheme}
                    onMessage={message => {
                        // console.log('onMessage:', message.nativeEvent.data);
                        const event = message.nativeEvent.data;
                        if (event === '__close:this:webpage') {
                            navigation?.goBack?.();
                            return;
                        }
                        try {
                            const { ref, ...rest } = JSON.parse(event);
                            awaitingTasks.current[ref](rest);
                        } catch (_) { }
                        setDocumentMessage?.(event);
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
            <KeyboardPlaceholderView />
        </View>
    );
};

const pageStyling = {
    flexer: { flex: 1 },

    main: commonAppBarStyle.main
};

const barStyling = {
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