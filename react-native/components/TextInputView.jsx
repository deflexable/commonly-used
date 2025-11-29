import { StyleSheet, TextInput } from "react-native";
import { Scope } from "@this_app_root/src/utils/scope";
import { forwardRef, useMemo } from "react";
import { useDarkMode } from "../theme_helper";

/**
 *  @type {import('react').FC<import('react-native').TextInputProps>}
 */
const TextInputView = forwardRef(function TextInputView({ style, invertColor, forceColor, forceSize, ...props }, ref) {
    const isDarkMode = useDarkMode();

    const thisStyle = useMemo(() => ({
        ...forceColor ? {} : { color: isDarkMode ? invertColor ? 'black' : 'white' : invertColor ? 'white' : 'black' },
        ...StyleSheet.flatten(style),
        ...forceColor ? { color: forceColor } : {},
        ...forceSize ? { fontSize: forceSize } : {}
    }), [invertColor, style, isDarkMode, forceColor]);

    return (
        <TextInput
            ref={ref}
            allowFontScaling={!!Scope.prefferedSettingsValue?.scale_font}
            placeholderTextColor={isDarkMode ? 'gray' : undefined}
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
            dodge_keyboard_input
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            {...props}
            style={thisStyle} />
    );
});

export default TextInputView;