import { StyleSheet, Text } from "react-native";
import { Scope } from "@this_app_root/src/utils/scope";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useDarkMode } from "../theme_helper";

/**
 * @typedef {object} TextExtraProps
 * @property {string} [forceColor]
 * @property {boolean} [invertColor]
 * @property {number} [forceSize]
 */

/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native').Text> & TextExtraProps>}
 */
const TextView = ({ children, style, invertColor, forceColor, forceSize, ...props }) => {
    const isDarkMode = useDarkMode();

    const thisStyle = useMemo(() => ({
        ...forceColor ? {} : { color: isDarkMode ? invertColor ? 'black' : 'white' : invertColor ? 'white' : 'black' },
        ...StyleSheet.flatten(style),
        ...forceColor ? { color: forceColor } : {},
        ...forceSize ? { fontSize: forceSize } : {}
    }), [invertColor, style, isDarkMode, forceColor]);

    return (
        <Text
            allowFontScaling={!!Scope.prefferedSettingsValue?.scale_font}
            style={thisStyle}
            {...props}>
            {children}
        </Text>
    )
}

export default TextView;

/**
 * @type {import('react').FC<import('react-native').TextProps>}
 */
export const DynamicTextView = forwardRef(({ children, style, key, ...props }, ref) => {
    const [thisChildren, setThisChildren] = useState(children);
    const [thisStyle, setThisStyle] = useState();

    const finalStyle = useMemo(() => ({
        ...StyleSheet.flatten(style),
        ...StyleSheet.flatten(thisStyle)
    }), [style, thisStyle]);

    useImperativeHandle(ref, () => ({
        setText: t => setThisChildren(t),
        setStyle: s => setThisStyle(s)
    }), []);

    useEffect(() => {
        setThisChildren(children);
    }, [children]);

    return (
        <TextView
            {...props}
            style={finalStyle}
            children={thisChildren} />
    );
});