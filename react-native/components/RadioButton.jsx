import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleSheet, useAnimatedValue } from "react-native";
import { Colors } from "@this_app_root/src/utils/values";
import { useDarkMode } from "./../theme_helper";
import { Mark } from "@this_app_root/src/utils/assets";

export default function ({ color = Colors.themeColor, size = 60, on = false, borderColor, style, isCheckBox }) {
    const isDarkMode = useDarkMode();

    const innerSizing = useAnimatedValue(0),
        borderSizing = useAnimatedValue(0),
        animationEngine = useRef([]);

    useEffect(() => {
        if (isCheckBox) return;
        animationEngine.current.forEach(e => {
            e.stop();
        });
        animationEngine.current[0] = Animated.timing(innerSizing, {
            toValue: on ? 100 : 0,
            duration: 300,
            useNativeDriver: false
        });
        animationEngine.current[1] = Animated.timing(borderSizing, {
            toValue: on ? 3 : 2,
            duration: 300,
            useNativeDriver: false
        });
        animationEngine.current.forEach(e => {
            e.start();
        });
    }, [on, isCheckBox]);

    const conStyle = useMemo(() => ({
        width: size,
        height: size,
        borderColor: on ? color : (borderColor || (isDarkMode ? Colors.lightDark : Colors.lightBorder)),
        borderWidth: isCheckBox ? 2 : borderSizing,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: isCheckBox ? 0 : 50,
        ...StyleSheet.flatten(style)
    }), [size, on, borderColor, isCheckBox, style]);

    const centerDotStyle = useMemo(() => {
        return {
            width: innerSizing.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '50%']
            }),
            height: innerSizing.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '50%']
            }),
            backgroundColor: color,
            borderRadius: 50,
            position: 'absolute'
        };
    }, [color]);

    return (
        <Animated.View style={conStyle}>
            {isCheckBox ?
                on ?
                    <Image
                        source={Mark}
                        tintColor={color}
                        style={styling.checkImg} />
                    : null
                : <Animated.View style={centerDotStyle} />}
        </Animated.View>
    );
};

const styling = {
    checkImg: {
        width: '110%',
        height: '110%',
        top: '-30%',
        right: '-30%',
        position: 'absolute'
    }
};