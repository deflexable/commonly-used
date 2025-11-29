import { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { themeStyle, useStyle } from '../page_helper';
import { Colors } from '@this_app_root/src/utils/values';
import TextView from './TextView';
import { DropDown } from '@this_app_root/src/utils/assets';
import Spinner from '@this_app_root/src/components/Spinner';

export default function ({
    selectedIndex,
    options = [],
    onSelect,
    containerStyle,
    style,
    textStyle,
    itemStyle,
    itemTextStyle,
    selectedStyle,
    selectedTextStyle,
    dropContainerStyle,
    renderButtonText,
    renderItemText,
    keyExtractor,
    itemTextProps,
    itemRowHeight,
    hideDropIcon
}) {
    const { styles, isDarkMode } = useStyle(dynamicStyle);

    const [conStyle, buttonStyle, buttonTxtStyle] = useMemo(() => {
        return [
            { ...styles.containerStyle, ...StyleSheet.flatten(containerStyle) },
            { ...styles.buttonStyle, ...StyleSheet.flatten(style) },
            { ...styles.buttonTextStyle, ...StyleSheet.flatten(textStyle) }
        ];
    }, [styles, textStyle, style, containerStyle]);

    const [itemRowStyle, selectedItemStyle] = useMemo(() => [
        { ...styles.itemStyle, ...itemStyle },
        { ...styles.itemStyle, ...itemStyle, backgroundColor: Colors.themeColor, ...StyleSheet.flatten(selectedStyle) }
    ], [styles, itemStyle, selectedStyle]);

    const dropperStyle = useMemo(() => ({
        backgroundColor: itemRowStyle.backgroundColor,
        ...StyleSheet.flatten(dropContainerStyle)
    }), [itemRowStyle.backgroundColor, dropContainerStyle]);

    const [itemTxtStyle, selectedItemTxtStyle] = useMemo(() => [
        {
            ...styles.itemTextStyle,
            ...StyleSheet.flatten(itemTextStyle)
        },
        {
            ...styles.itemTextStyle,
            color: isDarkMode ? Colors.dark : Colors.white,
            ...StyleSheet.flatten(itemTextStyle),
            ...StyleSheet.flatten(selectedTextStyle)
        }
    ], [styles, itemTextStyle, selectedTextStyle]);

    return (
        <Spinner
            style={conStyle}
            renderChildren={s =>
                <View style={buttonStyle}>
                    <TextView style={buttonTxtStyle}>
                        {renderButtonText ? renderButtonText(s) : `${s}`}
                    </TextView>

                    {hideDropIcon ? null :
                        <Image
                            source={DropDown}
                            style={styles.dropDownBtn} />}
                </View>
            }
            renderListRow={(v, i, selected) =>
                <View style={selected ? selectedItemStyle : itemRowStyle}>
                    <TextView
                        numberOfLines={1}
                        {...itemTextProps}
                        style={selected ? selectedItemTxtStyle : itemTxtStyle}>
                        {renderItemText ? renderItemText(v, i, selected) : `${v}`}
                    </TextView>
                </View>
            }
            seperatorColor={styles.itemSeperator.borderBottomColor}
            list={options}
            selectedIndex={selectedIndex === -1 ? undefined : selectedIndex}
            onSelected={onSelect}
            keyExtractor={keyExtractor}
            listContainerStyle={dropperStyle}
            rowHeight={itemRowHeight} />
    );
}

const dynamicStyle = {
    containerStyle: {},

    buttonStyle: {
        backgroundColor: themeStyle('rgba(233, 233, 233, 1)', Colors.dark),
        height: 40,
        borderRadius: 5,
        overflow: 'hidden',
        alignItems: 'center',
        flexDirection: 'row'
    },

    buttonTextStyle: {
        color: themeStyle(Colors.dark, Colors.white),
        fontWeight: '600',
        marginLeft: 7,
        flex: 1
    },

    itemStyle: {
        flex: 1,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeStyle('rgba(224, 224, 224, 1)', Colors.darkText)
    },

    itemTextStyle: {
        color: themeStyle(Colors.dark, Colors.white),
        flex: 1
    },

    itemSeperator: {
        borderBottomColor: themeStyle(Colors.borderColor, Colors.white25Opacity)
    },

    dropDownBtn: {
        width: 11,
        height: 11,
        tintColor: Colors.gray,
        marginRight: 13
    }
};