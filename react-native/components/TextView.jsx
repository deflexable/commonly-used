import { StyleSheet, Text } from "react-native";
import { JSONCacher } from "@/src/utils/cacher";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useDarkMode } from "../theme_helper";

/**
 * @typedef {object} TextExtraProps
 * @property {string} [forceColor]
 * @property {boolean} [invertColor]
 * @property {number} [forceSize]
 * @property {boolean} [bold]
 * @property {boolean} [center]
 * @property {number | number[]} [margin]
 * @property {number | number[]} [padding]
 */

/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native').Text> & TextExtraProps>}
 */
const TextView = ({ children, style, invertColor, forceColor, forceSize, bold, center, margin, padding, ...props }) => {
    const isDarkMode = useDarkMode();

    const thisStyle = useMemo(() => ({
        ...forceColor ? {} : { color: isDarkMode ? invertColor ? 'black' : 'white' : invertColor ? 'white' : 'black' },
        ...StyleSheet.flatten(style),
        ...forceColor ? { color: forceColor } : {},
        ...forceSize ? { fontSize: forceSize } : {},
        ...bold === undefined ? {} : { fontWeight: 'bold' },
        ...center === undefined ? {} : { textAlign: 'center' },
        ...margin === undefined ? {} : transformSpacing('margin', margin),
        ...padding === undefined ? {} : transformSpacing('padding', padding)
    }), [invertColor, style, isDarkMode, forceColor, forceSize, bold, center, `${margin}`, `${padding}`]);

    return (
        <Text
            allowFontScaling={!JSONCacher.USER_SETTINGS?.no_scale_font}
            style={thisStyle}
            {...props}>
            {children}
        </Text>
    )
};

const transformSpacing = (node, value = []) =>
    !Array.isArray(value)
        ? ({ [node]: value }) :
        value.length === 1
            ? ({ [`${node}Top`]: value[0] }) :
            value.length === 2 ? ({
                [`${node}Vertical`]: value[0],
                [`${node}Horizontal`]: value[1]
            }) :
                (value.length === 3 || value.length === 4)
                    ? ({
                        [`${node}Top`]: value[0],
                        [`${node}Right`]: value[1],
                        [`${node}Bottom`]: value[2],
                        ...value.length === 4 ? { [`${node}Left`]: value[3] } : {}
                    }) : (() => {
                        throw `invalid ${node} with value ${value}`;
                    })();

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