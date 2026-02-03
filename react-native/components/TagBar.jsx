import { Pressable, StyleSheet, View } from "react-native";
import { themeStyle, useStyle } from "./../page_helper";
import { Colors } from "@this_app_root/src/utils/values";
import TextView from "./TextView";
import { useMemo } from "react";

export default function ({ tagsList = [], selectedIndex, onChangeTag, renderEndItem, style }) {
    const { styles } = useStyle(tabBarStyle);

    const conStyle = useMemo(() => ({
        ...styles.con,
        ...StyleSheet.flatten(style)
    }), [style]);

    return (
        <View style={conStyle}>
            <View style={styles.btnFlexerCon}>
                {tagsList.map((v, i) => {
                    const isSelected = i === selectedIndex;

                    return (
                        <Pressable
                            key={i}
                            style={isSelected ? styles.btnSelected : styles.btn}
                            disabled={isSelected}
                            onPress={() => {
                                onChangeTag?.(v, i);
                            }}>
                            <TextView
                                invertColor={isSelected}
                                style={styles.btnTxt}>
                                {v}
                            </TextView>
                        </Pressable>
                    );
                })}
            </View>
            {renderEndItem?.() || null}
        </View>
    );
};

const CommonBtnStyle = {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 10,
    marginTop: 10,
    borderRadius: 7,
    borderWidth: 1
};

const tabBarStyle = {
    con: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15
    },

    btnFlexerCon: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginRight: 5
    },

    btn: {
        ...CommonBtnStyle,
        backgroundColor: 'transparent',
        borderColor: themeStyle(Colors.textBG, Colors.lightBlack)
    },

    btnSelected: {
        ...CommonBtnStyle,
        backgroundColor: Colors.themeColor,
        borderColor: 'transparent'
    },

    btnTxt: {
        fontSize: 13,
        fontWeight: 'bold'
    }
};