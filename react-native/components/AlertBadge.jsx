import { Image, useAnimatedValue, View, Animated, PanResponder, Dimensions, TouchableOpacity, Vibration } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Colors } from "@/src/utils/values";
import TextView from "bbx-commonly-used/react-native/components/TextView";
import { themeStyle, useStyle } from "bbx-commonly-used/react-native/page_helper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { downScaleImage } from "bbx-commonly-used/common/methods";
import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { auth, collection } from "bbx-commonly-used/react-native/client_server";
import { handleLink } from '@/src/utils/link_handler';
import { LightLogo, DarkLogo } from '@/src/utils/assets';
import { DbPath } from 'core/common_values';

const OpenOffset = 25;

/**
 * 
 * @param {{onShouldShowAlert?: (event: import('@react-native-firebase/messaging').FirebaseMessagingTypes.RemoteMessage) => boolean}} param0 
 * @returns 
 */
export default function AlertBadge({ onShouldShowAlert }) {
    const { styles, isDarkMode } = useStyle(styling);
    const { top: topSpacing } = useSafeAreaInsets();

    const closureOffset = -70 - topSpacing;

    const [data, setData] = useState();
    const [width, setWidth] = useState(0);

    const translateX = useAnimatedValue(0);
    const translateY = useAnimatedValue(closureOffset);

    const open = useRef();
    const pendingAlert = useRef([]);
    const timer = useRef();

    useEffect(() => {
        return onMessage(getMessaging(), async event => {
            const { data, notification } = event;
            const { targetUid, alertion, nodeId, link } = data || {};

            if (alertion || !onShouldShowAlert?.(event)) return;

            if (
                targetUid &&
                (targetUid !== (await auth().getAuth())?.uid)
            ) {
                console.log('skipped target user fcm:', targetUid);
                return;
            }

            open.current({
                title: `${notification?.title}`,
                message: `${notification.body}`,
                photo: notification?.android?.smallIcon || notification?.icon,
                nodeId,
                link
            });
        });
    }, []);

    useEffect(() => {
        if (data) {
            move(true);
            Vibration.vibrate(400);
        } else {
            if (pendingAlert.current.length)
                open.current(pendingAlert.current.splice(0, 1)[0]);
        }
    }, [!data]);

    const move = (down) => {
        Animated.timing(translateY, {
            toValue: down ? topSpacing + OpenOffset : closureOffset,
            duration: 500,
            useNativeDriver: true
        }).start((o) => {
            if (!o?.finished) return;
            if (down) {
                timer.current =
                    setTimeout(() => {
                        move();
                    }, 5000);
            } else setData();
        });
    }

    open.current = (info) => {

        if (data) {
            pendingAlert.current.push(info);
            return;
        }
        setData(info);
    }

    const dismiss = () => {
        clearTimeout(timer.current);
        translateY.setValue(closureOffset);
        setData();
    }

    const panGesture =
        useMemo(() => {
            return PanResponder.create({
                onMoveShouldSetPanResponder: () => {
                    return true;
                },
                onPanResponderMove: (_, gesture) => {
                    translateX.setValue(gesture.dx);
                },
                onPanResponderRelease: (_, gesture) => {
                    if (Math.abs(gesture.dx) >= width * .3) {
                        const windowWidth = Dimensions.get('screen').width - (width * .5);

                        Animated.spring(translateX, {
                            toValue: gesture.dx > 0 ? windowWidth : -windowWidth,
                            useNativeDriver: true
                        }).start(dismiss);
                    } else {
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true
                        }).start();
                    }
                }
            });
        }, [width]);

    return (
        <View style={styles.packer}>
            <Animated.View
                {...panGesture.panHandlers}
                style={{ transform: [{ translateY }] }}>
                <Animated.View
                    style={[styles.con, { transform: [{ translateX }] }]}
                    onLayout={e => {
                        setWidth(e.nativeEvent.layout.width);
                    }}>
                    <TouchableOpacity
                        disabled={!data}
                        style={styles.cont}
                        onPress={() => {
                            if (data.link)
                                handleLink(data?.link);

                            if (data.nodeId)
                                collection(DbPath.myNotification)
                                    .updateOne({ _id: data.nodeId }, {
                                        $unset: { unread: true }
                                    });
                            dismiss();
                        }}>
                        <Image
                            style={styles.img}
                            source={
                                data?.photo
                                    ? { uri: downScaleImage(data?.photo) }
                                    : isDarkMode
                                        ? DarkLogo
                                        : LightLogo
                            } />
                        <View style={styles.infoCon}>
                            <TextView
                                bold
                                numberOfLines={1}
                                forceSize={16}
                                margin={[0, 0, 1, 0]}>
                                {data?.title}
                            </TextView>
                            <TextView
                                numberOfLines={2}
                                forceSize={13}
                                margin={[1, 0, 0, 0]}>
                                {data?.message}
                            </TextView>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styling = {
    packer: {
        position: 'absolute',
        top: 0,
        width: '100%'
    },

    con: {
        marginHorizontal: 15,
        width: '90%',
        maxWidth: 500,
        borderRadius: 10,
        alignSelf: 'center',
        backgroundColor: themeStyle(Colors.white, Colors.dark),
        elevation: 6,
        shadowColor: themeStyle('#000', '#fff'),
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: .1,
        shadowRadius: 7
    },

    cont: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7
    },

    img: {
        width: 35,
        height: 35,
        marginLeft: 10,
        borderRadius: 5
    },

    infoCon: {
        flex: 1,
        marginHorizontal: 10
    }
};