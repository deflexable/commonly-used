import { useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, Pressable, TextInput } from "react-native";
import { WEB_BASE_URL } from "@this_app_root/env";
import { useMentions } from 'react-native-controlled-mentions';
import { Colors } from '@this_app_root/src/utils/values';
import { searchUser } from '@this_app_root/src/utils/processor';
import UserPhoto from './UserPhoto';
import { themeStyle, useStyle } from '../page_helper';
import TextView from "./TextView";

/**
 * @type {import('react-native-controlled-mentions')['MentionInput']}
 */
const MentionInput = ({ onChange, onChangeText, value = '', inputRef, defaultValue, ...restProps }) => {
    const [text, setText] = useState(value);

    const triggersConfig = useMemo(() => ({
        mention: {
            trigger: '@',
            allowedSpacesCount: 0,
            isInsertSpaceAfterMention: true,
            textStyle: { color: Colors.themeColor }
        }
    }), []);

    const { textInputProps, triggers } = useMentions({
        value: text,
        onChange: t => {
            setText(t);
            onChange?.(t);
            onChangeText?.(t);
        },
        triggersConfig
    });

    useEffect(() => {
        if (typeof value === 'string') setText(value);
    }, [value]);

    useEffect(() => {
        if (typeof defaultValue === 'string') setText(defaultValue);
    }, [defaultValue]);

    return (
        <>
            <MentionFloat
                onMentionUser={triggers.mention.onSelect}
                keyword={triggers.mention.keyword} />
            <TextInput
                ref={inputRef}
                {...restProps}
                {...textInputProps} />
        </>
    );
};

export default MentionInput;

const MentionFloat = ({ onMentionUser, keyword = '' }) => {
    const { styles } = useStyle(dynamicStyle);

    const [users, setUsers] = useState([]);

    const lastRef = useRef(0);

    useEffect(() => {
        console.log('MentionFloat keyword:', keyword);
        setUsers([]);

        const ref = ++lastRef.current;
        searchUser({
            search: `@${keyword || ''}`,
            limit: 5,
            enforceMe: true
        }).then(q => {
            if (ref !== lastRef.current) return;
            setUsers(q.data);
        });
    }, [keyword]);

    if (!keyword || !users.length) return null;

    return (
        <View style={styles.cont}>
            <FlatList
                style={styles.scroller}
                data={users || []}
                keyboardShouldPersistTaps={'always'}
                renderItem={({ item, index }) =>
                    <Pressable
                        style={(!index || (index === users.length - 1)) ? styles.userBtnConEdges : styles.userBtnCon}
                        onPress={() => {
                            onMentionUser?.({ name: item.at, id: item.at });
                        }}>
                        <UserPhoto
                            size={25}
                            src={item.photo}
                            vip={item.vip} />

                        <View style={styles.userInfoCon}>
                            <TextView style={styles.nameTxt}>
                                {item.name}
                            </TextView>
                            <TextView style={styles.atTxt}>
                                {`@${item.at}`}
                            </TextView>
                        </View>
                    </Pressable>
                }
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator
            />
        </View>
    );
};

const dynamicStyle = {
    cont: {
        backgroundColor: themeStyle(Colors.white, 'black'),
        shadowOpacity: 0.5,
        shadowOffset: { width: 4, height: 4 },
        shadowColor: themeStyle(Colors.borderColor, Colors.dark),
        borderRadius: 7
    },

    scroller: { maxHeight: 170 },

    userBtnCon: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 11
    },

    userBtnConEdges: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 11
    },

    userInfoCon: {
        marginLeft: 4,
        flex: 1
    },

    nameTxt: {
        color: themeStyle(Colors.dark, 'white'),
        fontSize: 13
    },

    atTxt: { color: Colors.gray, fontSize: 11 }
};

export const MAKE_MENTION_ELEMENT = (mention) => `<a href="${WEB_BASE_URL}/@${mention}">@${mention}</a>`;