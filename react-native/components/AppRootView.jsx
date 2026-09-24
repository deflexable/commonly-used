import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Platform, StatusBar, TouchableOpacity, View } from 'react-native';
import { APP_NAME, WEB_BASE_URL, CURRENT_APP_VERSION } from '@/env';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getCrashlytics, log as logCrashlytics } from '@react-native-firebase/crashlytics';
import { LoadingOverlay, PageLoader } from './TemplateItems';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import app_navigator from '../app_navigator';
import { Colors } from '@/src/utils/values';
import { useTranslation } from '../locale';
import { handleLink } from '@/src/utils/link_handler';
import listeners, { EVENT_NAMES } from '../listeners';
import { APPSTORE_URL, DbPath, PLAYSTORE_URL } from 'core/common_values';
import { auth, collection, fetchHttp } from '../client_server';
import FancyPopup from './FancyPopup';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import TextView from './TextView';
import { JSONCacher } from '@/src/utils/cacher';
import { pushBackListener } from 'react-native-push-back';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SnapSheetProvider } from 'react-native-snap-sheet';
import { alertDialog, themeStyle, useStyle, alertError, alertNull } from '../page_helper.js';
import { getInitialNotification, getMessaging, onMessage, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import { getMachineCode } from '../../src/index.js';
import { locales } from '../locale';
import { LockedFixedModal } from './AppModal';
import { Validator } from "guard-object";

export const StackScreen = createStackNavigator();

const bannedPromise =
    getMachineCode().then(code =>
        collection(DbPath.bannedMachine)
            .findOne({ _id: code })
            .get({ retrieval: 'no-cache-await' })
    );

const versionControlPromise =
    collection(DbPath.VERSION_CONTROL)
        .findOne({ platform: Platform.OS, version: CURRENT_APP_VERSION })
        .get({ retrieval: 'no-cache-await' });

export const NormalScreenOptions = { presentation: 'card' };
export const FloatingScreenOptions = {
    cardOverlayEnabled: true,
    presentation: 'transparentModal',
    gestureEnabled: false,
    headerShown: false,
    animation: 'none'
};

const onPressUpate = () => Linking.openURL(Platform.OS === 'android' ? PLAYSTORE_URL : APPSTORE_URL);

export default function useAppRootView({ user }) {
    const initDiscontinued = useMemo(() => JSONCacher.LAST_VC_DISCONTINUE === CURRENT_APP_VERSION, []);
    const initBannedValue = useMemo(() => !!JSONCacher.LAST_BAN, []);

    const openCounter =
        useMemo(() => {
            const c = ((JSONCacher.APP_OPEN_COUNTER || 0) * 1) + 1;
            return JSONCacher.APP_OPEN_COUNTER = c;
        }, []);

    const [isDiscontinued, setDiscontinued] = useState(initDiscontinued),
        [isMachineBanned, setMachineBanned] = useState(initBannedValue),
        [pageTransObj, setPageTransObj] = useState(),
        [enableGesture, setEnableGesture] = useState(true);

    const { styles, isDarkMode } = useStyle(styling);

    const thisCurrentScreen = useRef();
    const onScreenChanged = useRef();

    const hasAppError = !!(isDiscontinued || isMachineBanned || !!user?.disabled);

    useEffect(() => {
        if (pageTransObj) {
            LockedFixedModal.loadingTrans = true;
            listeners.dispatch(EVENT_NAMES.lockedModalListener);
            const listener = pushBackListener(() => { });

            return () => {
                LockedFixedModal.loadingTrans = false;
                listeners.dispatch(EVENT_NAMES.lockedModalListener);
                listener();
            };
        }
    }, [!pageTransObj]);

    useEffect(() => {
        logEvent(getAnalytics(), 'app_open');
        logCrashlytics(getCrashlytics(), 'User opened app.');

        Linking.getInitialURL().then(url => {
            handleLink(url);
        });

        const deepLinkListener =
            Linking.addEventListener('url', ({ url }) => {
                handleLink(url);
            });
        const pageTransModalListener =
            listeners.listenTo(EVENT_NAMES.pageTransMessageModalListener, (obj) => {
                setPageTransObj(obj);
            });
        const lockedModalListener =
            listeners.listenTo(EVENT_NAMES.lockedModalListener, () => {
                setEnableGesture(!Object.values(LockedFixedModal).some(v => v));
            });

        notifyUpdateVersion();
        checkBannedStatus();

        /**
         * @param {import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage} event 
         * @returns {void}
         */
        const handleFcmEvent = async event => {
            console.log('handleFcmEvent event:', event);
            const { link, nodeId, targetUid } = event?.data || {};
            let thisUid;

            if (
                targetUid &&
                (targetUid !== (thisUid = (await auth().getAuth()).uid))
            ) {
                console.log('skipped fcm:', { thisUid, targetUid });
                return;
            }

            handleLink(link);
            if (nodeId)
                collection(DbPath.myNotification).updateOne({ _id: nodeId }, {
                    $unset: { unread: true }
                });
        };

        getInitialNotification(getMessaging()).then(r => {
            if (r && !globalThis.__hasHandledInitialNotificationLink) handleFcmEvent(r);
            globalThis.__hasHandledInitialNotificationLink = true;
        });
        const fcmListener = onNotificationOpenedApp(getMessaging(), handleFcmEvent);

        const foregroundFcmListener =
            onMessage(getMessaging(), event => {
                // const { targetUid, ref: key, action, title, body, subText, profilePic, templatedImage, overridenNotification } = data;
                // TODO: do in-app toast
                console.log('foregroundFcmListener event:', event);
                const { data, notification } = event;
                const alertion = data?.alertion;

                if (alertion) {
                    const { title, body } = notification || {};
                    const { positiveLink, negativeLink, positive, negative } = Validator.OBJECT(alertion) ? alertion : {};
                    const onPositive = () => {
                        if (positiveLink === false) return;
                        handleLink(positiveLink || data?.link);
                    }

                    if (negativeLink) {
                        alertDialog(`${title}`, `${body}`, onPositive, () => {
                            handleLink(negativeLink);
                        }, positive || locales.view || 'View', negative || locales.dismiss || 'Dismiss', false);
                    } else {
                        alertNull(`${title}`, `${body}`, onPositive, positive || locales.view || 'View', true);
                    }
                }
            });

        return () => {
            foregroundFcmListener();
            fcmListener();
            pageTransModalListener();
            lockedModalListener();
            deepLinkListener.remove();
        }
    }, []);

    const checkBannedStatus = async () => {
        setMachineBanned(JSONCacher.LAST_BAN = !!(await bannedPromise));
    }

    const notifyUpdateVersion = async () => {
        const snapshot = await versionControlPromise;

        JSONCacher.LAST_VC_DISCONTINUE = snapshot?.strict && CURRENT_APP_VERSION;
        setDiscontinued(!!snapshot?.strict);

        if (!!snapshot?.upgradable) {
            const ite = ((JSONCacher.UPGRADER_REMINDER_ITE || 0) * 1);

            if (
                JSONCacher.UPGRADER_LAST_VERSION !== snapshot.upgradable ||
                !(ite % 7)
            ) {
                alertDialog(
                    locales.app_update,
                    `${locales.version} ${snapshot.upgradable} ${locales.is_here}! 🎉, ${locales.app_update_message}`,
                    onPressUpate,
                    undefined,
                    locales.update,
                    locales.dismiss
                );
            }

            JSONCacher.UPGRADER_REMINDER_ITE = ite + 1;
            JSONCacher.UPGRADER_LAST_VERSION = snapshot.upgradable;
        }
    }

    let renderScreenElement;

    if (hasAppError) {
        renderScreenElement = () => (
            <AppErrorElement
                isMachineBanned={isMachineBanned}
                isDiscontinued={isDiscontinued} />
        );
    } else {
        renderScreenElement = ({ renderScreen, renderChild } = {}) => (
            <GestureHandlerRootView>
                <SafeAreaProvider
                    style={styles.flexer}
                    initialMetrics={initialWindowMetrics}>
                    <SnapSheetProvider>
                        <View style={styles.container}>
                            <StatusBar
                                translucent
                                backgroundColor='transparent'
                                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                            />
                            <NavigationContainer
                                ref={app_navigator.navigationReference}
                                onStateChange={s => {
                                    const currentScreen = s.routes.slice(-1)[0].name;
                                    logEvent(getAnalytics(), 'screen_view', {
                                        screen_class: currentScreen,
                                        screen_name: currentScreen
                                    });
                                    thisCurrentScreen.current = currentScreen;
                                    if (!JSONCacher.EXPLORED_SCREENS?.[currentScreen]) {
                                        const n = JSONCacher.EXPLORED_SCREENS || {};
                                        n[currentScreen] = true;
                                        JSONCacher.EXPLORED_SCREENS = n;
                                    }
                                    onScreenChanged.current();
                                }}>
                                <StackScreen.Navigator
                                    screenOptions={{
                                        headerShown: false,
                                        gestureEnabled: pageTransObj ? false : (enableGesture && undefined)
                                    }}>
                                    {renderScreen()}
                                </StackScreen.Navigator>
                            </NavigationContainer>
                        </View>
                        {pageTransObj ?
                            <LoadingOverlay
                                message={pageTransObj?.message}
                                backgroundColor={isDarkMode ? Colors.black : Colors.appBackgroundColor}
                                backgroundOpacity={.65} /> : null}
                    </SnapSheetProvider>
                    <FancyPopup />
                    {renderChild()}
                </SafeAreaProvider>
            </GestureHandlerRootView>
        );
    }

    return {
        renderScreenElement,
        enableGesture,
        pageTransObj,
        openCounter,
        onScreenChanged,
        currentScreen: thisCurrentScreen
    };
};

export const uniquifyScreen = (a) =>
    (e) => a
        ? a.map(v => `${e.params?.[v]}`).join('_')
        : Object.keys({ ...e.params }).sort().map(k => `${k}-${JSON.stringify(e.params?.[k])}`).join('_');

const styling = {
    flexer: { flex: 1 },

    container: {
        flex: 1,
        backgroundColor: themeStyle(Colors.appBackgroundColor, Colors.black)
    }
};

const AppErrorElement = ({ isMachineBanned, isDiscontinued }) => {
    const { lang } = useTranslation();

    const { styles, isDarkMode } = useStyle(appErrorStyles);

    const [localeData, setLocaleData] = useState();

    useEffect(() => {
        setLocaleData();
        const prefix = isMachineBanned ? 'banned' : isDiscontinued ? 'version' : 'suspended';
        fetchHttp(WEB_BASE_URL.concat(`/locale_data/${lang}/${prefix}-app-error`), undefined, { retrieval: 'sticky' })
            .then(async r => {
                setLocaleData(await r.json());
            })
            .catch(e => {
                onCloseModal?.();
                alertError(e);
            });
    }, [lang]);


    if (!localeData) return <PageLoader />;

    const translations = localeData;

    return (
        <GestureHandlerRootView>
            <View style={styles.flexer}>
                <StatusBar
                    translucent
                    backgroundColor='transparent'
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                />
                <View style={styles.discontinueCon}>
                    <View style={styles.discontinueCont}>
                        <TextView style={styles.discontinueTitle}>
                            {isMachineBanned
                                ? translations.device_suspended
                                : isDiscontinued
                                    ? translations.software_update
                                    : translations.suspended_title}
                        </TextView>

                        <Image
                            source={
                                isMachineBanned
                                    ? require('@/src/assets/blocked.png')
                                    : isDiscontinued
                                        ? require('@/src/assets/updating.png')
                                        : require('@/src/assets/user_blocked.png')
                            }
                            style={styles.image} />

                        <TextView style={styles.discontinueDes}>
                            {isMachineBanned
                                ? `${translations.device_suspended_des_prefix} ${APP_NAME}, ${translations.device_suspended_des_suffix}`
                                : isDiscontinued
                                    ? translations.strict_version_des
                                    : translations.suspended_des}
                        </TextView>

                        {isMachineBanned
                            ? null :
                            <TouchableOpacity
                                style={styles.discontinueUpdateBtn}
                                onPress={() => {
                                    if (isDiscontinued) {
                                        onPressUpate();
                                    } else {
                                        auth().signOut();
                                    }
                                }}>
                                <TextView
                                    invertColor
                                    style={{
                                        fontWeight: 'bold',
                                        fontSize: 20
                                    }}>
                                    {isDiscontinued ? translations.update : translations.logout}
                                </TextView>
                            </TouchableOpacity>}
                    </View>
                </View>
            </View>
        </GestureHandlerRootView>
    );
};

const appErrorStyles = {
    flexer: { flex: 1 },

    discontinueCon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeStyle(Colors.appBackgroundColor, Colors.black)
    },

    discontinueCont: {
        flexDirection: 'column',
        alignItems: 'center',
        width: '80vw'
    },

    discontinueTitle: {
        fontWeight: 'bold',
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 15,
        color: themeStyle(Colors.black, Colors.white)
    },

    image: { width: 120, height: 120 },

    discontinueDes: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 9,
        marginHorizontal: '10%',
        color: themeStyle(Colors.gray, Colors.white)
    },

    discontinueUpdateBtn: {
        minWidth: 170,
        backgroundColor: Colors.themeColor,
        paddingVertical: 7,
        paddingHorizontal: 30,
        borderRadius: 7,
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center'
    }
};