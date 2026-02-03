import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@this_app_root/src/locale';
import { Colors } from '@this_app_root/src/utils/values';
import { useDarkMode } from './../theme_helper';
import TextView from './TextView';
import { handleLink } from '@this_app_root/src/utils/link_handler';

export function Truncate({
    style,
    expandButtonStyle,
    expandButtonBG,
    expandButtonBottom,
    toggleComponent,
    expandText,
    expandButtonTextStyle,
    onLayout,
    numberOfLines,
    children,
    key,
    ...restProps
}) {
    const isDarkMode = useDarkMode();

    if (expandButtonBG === undefined)
        expandButtonBG = isDarkMode ? Colors.dark : Colors.white;

    const { translations } = useTranslation();
    const [expanded, setExpanded] = useState(),
        [expandable, setExpandable] = useState(),
        [fullHeight, setFullHeight] = useState(),
        [elapsedHeight, setElapsedHeight] = useState();

    const isTextTruncator = typeof children === 'string';

    const isToggling = useRef();

    useEffect(() => {
        if (typeof fullHeight === 'number' && typeof elapsedHeight === 'number' && !isToggling.current) {
            const enlargable = fullHeight - 10 > elapsedHeight;

            setExpandable(enlargable);
            setExpanded(!enlargable);
        }
        isToggling.current = false;
    }, [fullHeight, elapsedHeight]);

    const fullStying = useMemo(() => ({
        position: 'absolute',
        width: '100%',
        opacity: 0,
        ...StyleSheet.flatten(style)
    }), [style]);

    const flattenStyle = StyleSheet.flatten(fullStying);
    const sniffedfontSize = flattenStyle.fontSize;

    if (isTextTruncator) {
        if (flattenStyle.maxHeight !== undefined)
            throw '"maxHeight" shouldn\'t be provided if <Truncate /> children is a string';
    } else if (flattenStyle.height !== undefined)
        throw '"height" shouldn\'t be provided if <Truncate /> children is a react component';

    const expandBtnStyle = useMemo(() => ({
        paddingHorizontal: 7,
        paddingVertical: 1,
        backgroundColor: expandButtonBG || 'white',
        position: 'absolute',
        bottom: expanded ? (expandButtonBottom || 0) : 0,
        right: 0,
        borderRadius: 20,
        ...StyleSheet.flatten(expandButtonStyle)
    }), [expandButtonStyle, expanded, expandButtonBG, expandButtonBottom]);

    const expandBtnTxtStyle = useMemo(() => ({
        color: 'rgb(145,181,251)',
        fontWeight: 'bold',
        ...isNaN(sniffedfontSize) ? undefined : { fontSize: sniffedfontSize },
        ...StyleSheet.flatten(expandButtonTextStyle)
    }), [expandButtonTextStyle]);

    const renderExpandToggle = () => (
        <TouchableOpacity
            activeOpacity={1}
            style={expandBtnStyle}
            onPress={() => {
                isToggling.current = true;
                setExpanded(!expanded);
            }}>
            {
                toggleComponent ? toggleComponent(expanded)
                    :
                    <Text style={expandBtnTxtStyle}>
                        {expandText ? expandText[expanded ? 1 : 0]
                            : (expanded ? `<< ${translations.show_less}`
                                : `${translations.show_more} >>`)}
                    </Text>
            }
        </TouchableOpacity>
    );

    const truncateStyle1 = useMemo(() => {
        return { ...fullStying, maxHeight: undefined };
    }, [fullStying]);

    const truncateStyle2 = useMemo(() => ({
        overflow: 'hidden',
        ...StyleSheet.flatten(style),
        maxHeight: expanded ? undefined : flattenStyle.maxHeight
    }), [style]);

    return (
        <View>
            {isTextTruncator ?
                <>
                    <HyperText
                        {...restProps}
                        style={fullStying}
                        onLayout={e => {
                            setFullHeight(e.nativeEvent.layout.height);
                        }}>
                        {children}
                    </HyperText>

                    <HyperText
                        {...restProps}
                        style={style}
                        numberOfLines={expanded ? undefined : numberOfLines}
                        onLayout={e => {
                            setElapsedHeight(e.nativeEvent.layout.height);
                            if (onLayout) onLayout(e);
                        }}>
                        {children}
                    </HyperText>
                </> :
                <>
                    <View>
                        <View
                            {...restProps}
                            style={truncateStyle1}
                            onLayout={e => {
                                setFullHeight(e.nativeEvent.layout.height);
                            }}>
                            {children}
                        </View>

                        <View
                            {...restProps}
                            style={truncateStyle2}
                            onLayout={e => {
                                setElapsedHeight(e.nativeEvent.layout.height);
                                if (onLayout) onLayout(e);
                            }}>
                            {children}
                        </View>
                    </View>
                </>}
            {expandable ? renderExpandToggle() : null}
        </View>
    );
}

export const HyperText = ({ doLink, children, linkColor = 'rgb(145, 181, 251)', ...props }) => {
    if (typeof children !== 'string') throw 'HyperText children must be a string';

    const linkList = useMemo(() => linkify(children), [children]);
    const { style, allowFontScaling, maxFontSizeMultiplier, minimumFontScale, pointerEvents } = props;
    const inheritedProps = {
        // style,
        allowFontScaling,
        maxFontSizeMultiplier,
        minimumFontScale,
        pointerEvents
    };

    const newChildren =
        !linkList.some(v => v.isLink)
            ? children
            : linkList.map((v, i) => {
                if (!v.isLink) return <TextView {...inheritedProps} children={v.value} key={i} />;

                return (
                    <TextView
                        {...inheritedProps}
                        children={v.value}
                        forceColor={linkColor}
                        onPress={() => {
                            handleLink(v.value.trim());
                        }}
                        {...doLink?.(v.value)}
                        key={i} />
                );
            });

    return (
        <TextView {...props}>
            {newChildren}
        </TextView>
    );
}

function linkify(text = '') {
    const regex = /https:\/\/[^\s"'<>]+/g;
    const result = [];

    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
        const { index } = match;
        const url = match[0];

        // text before the link
        if (index > lastIndex) {
            result.push({
                value: text.slice(lastIndex, index),
                isLink: false
            });
        }

        // the link itself
        result.push({
            value: url,
            isLink: true
        });

        lastIndex = index + url.length;
    }

    // remaining text after last link
    if (lastIndex < text.length) {
        result.push({
            value: text.slice(lastIndex),
            isLink: false
        });
    }

    return result;
}