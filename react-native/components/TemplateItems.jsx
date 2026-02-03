import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import TextView from "./TextView";
import { EmptySpace } from "@this_app_root/src/utils/assets";
import { useDarkMode } from "./../theme_helper";
import { Colors } from "@this_app_root/src/utils/values";
import { useTranslation } from "@this_app_root/src/locale";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const LoadingOverlay = ({
    message,
    size = 45,
    zIndex = 99,
    backgroundColor = Colors.transparent,
    backgroundOpacity = .7
}) => {
    const isDarkMode = useDarkMode();

    const conStyle = useMemo(() => ({
        ...StyleSheet.absoluteFill,
        ...zIndex ? { zIndex } : undefined,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    }), [zIndex]);

    const bgStyle = useMemo(() => ({
        ...StyleSheet.absoluteFill,
        backgroundColor,
        opacity: backgroundOpacity
    }), [isDarkMode, backgroundColor]);

    return (
        <View style={conStyle}>
            <View style={bgStyle} />
            <ActivityIndicator
                size={size}
                color={Colors.themeColor} />
            {message ?
                <TextView style={overlayTxt}>
                    {message}
                </TextView> : null}
        </View>
    );
};

const overlayTxt = {
    textAlign: 'center',
    marginTop: 9
};

export const PaginationItem = ({ height = 100, size = 35, hidden, makeSpace = true, extraSpacing = 0 }) => {
    const { bottom: bottomSpace } = useSafeAreaInsets();

    const spacingStyle = useMemo(() => {
        if (makeSpace) return { paddingBottom: bottomSpace + extraSpacing };
    }, [bottomSpace, makeSpace, extraSpacing]);

    const conStyle = useMemo(() => {
        return { height };
    }, [height]);

    return (
        <View style={spacingStyle}>
            {hidden ? null :
                <View style={conStyle}>
                    <LoadingOverlay
                        size={size}
                        zIndex={0}
                        backgroundColor={Colors.transparent}
                    />
                </View>}
        </View>
    );
};

export const EmptyLogo = ({ message, messageStyle, des, onPressTxt, onPress, src, style, height }) => {
    const { translations } = useTranslation();

    const conStyle = useMemo(() => {
        return {
            ...height ? { height } : { flex: 1 },
            alignItems: 'center',
            justifyContent: 'center'
        };
    }, [height]);

    const imgStyle = useMemo(() => {
        if (!style) return { width: 150, height: 150 };
        return [{ width: 150, height: 150 }, style];
    }, [style]);

    const mstyle = useMemo(() => ({ ...emptyStying.baseTxt, ...messageStyle }), [messageStyle]);

    return (
        <View style={conStyle}>
            <Image
                source={src || EmptySpace}
                style={imgStyle} />
            <TextView style={mstyle}>
                {message || translations.no_result_found}
            </TextView>
            {
                (des || onPress) ?
                    <View style={emptyStying.baseInfoCon}>
                        {des ?
                            <TextView style={emptyStying.baseDes}>
                                {des}
                            </TextView> : null}
                        {onPress ?
                            <TouchableOpacity
                                onPress={onPress}
                                style={emptyStying.baseBtn}>
                                <TextView
                                    invertColor
                                    style={emptyStying.baseBtnTxt}>
                                    {onPressTxt}
                                </TextView>
                            </TouchableOpacity> : null}
                    </View> : null
            }
        </View>
    );
};

const emptyStying = {
    baseTxt: {
        fontWeight: 'bold',
        fontSize: 25,
        textAlign: 'center',
        marginTop: 7,
        color: Colors.gray,
        fontStyle: 'italic',
        marginHorizontal: 15
    },

    baseInfoCon: { alignItems: 'center' },

    baseDes: {
        textAlign: 'center',
        color: Colors.gray,
        fontSize: 15,
        marginTop: 7,
        marginHorizontal: 25
    },

    baseBtn: {
        backgroundColor: Colors.themeColor,
        paddingVertical: 10,
        paddingHorizontal: 70,
        borderRadius: 9,
        marginTop: 20
    },

    baseBtnTxt: {
        textAlign: 'center',
        fontSize: 17,
        fontWeight: 'bold'
    }
};

export const PageLoader = ({ height }) => {
    const conStyle = useMemo(() => {
        return height ? { height } : { flex: 1 };
    }, [height]);

    return (
        <View style={conStyle}>
            <LoadingOverlay zIndex={0} />
        </View>
    );
};