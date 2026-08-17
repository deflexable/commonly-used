import { useRef, useState } from "react";
import { Button, Image, ScrollView, TouchableOpacity, View } from "react-native";
import { PlainModalBG, ModalScreen } from "./AppModal";
import { useStyle } from "../page_helper";
import DatePicker from "react-native-date-picker";
import { one_hour, one_minute } from "../../common/timing";
import { Colors } from "@/src/utils/values";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import app_navigator from "../app_navigator";
import { useTranslation } from "@/src/locale";
import { Back } from "@/src/utils/assets";

export default function ({ route: { params: { date, onDate, maximumValue, minimumValue, dateOff, timeOff } } }) {
    const modalRef = useRef();
    const insets = useSafeAreaInsets();

    return (
        <View style={styling.flexer}>
            <ModalScreen
                modalRef={modalRef}
                modalBackGround={PlainModalBG}
                modalHeight={330 + insets.bottom}>
                <Template
                    initDate={date}
                    maximumValue={maximumValue}
                    minimumValue={minimumValue}
                    dateOff={dateOff}
                    timeOff={timeOff}
                    insets={insets}
                    onComplete={e => {
                        modalRef.current.close();
                        onDate?.(e);
                        onDate = undefined;
                    }} />
            </ModalScreen>
        </View>
    );
};

const Template = ({ onComplete, initDate, minimumValue, maximumValue, dateOff, timeOff, insets }) => {
    const { windowWidth, isDarkMode } = useStyle(styling);
    const { translations, lang } = useTranslation();

    const [date, setDate] = useState(() => initDate ? new Date(initDate) : new Date());
    const [time, setTime] = useState(() => new Date(date));

    const scrollRef = useRef();

    const minimumDate =
        (minimumValue instanceof Date || Number.isInteger(minimumValue))
            ? new Date(minimumValue)
            : minimumValue === undefined
                ? new Date()
                : undefined;

    const maximumDate =
        (maximumValue instanceof Date || Number.isInteger(maximumValue))
            ? new Date(maximumValue)
            : undefined;

    const renderChild = ({ elem, onPress, done, onPressBack }) =>
        <View style={{
            width: windowWidth,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {onPressBack ?
                <TouchableOpacity
                    style={styling.backBtn}
                    onPress={onPressBack}>
                    <Image
                        source={Back}
                        style={{
                            width: 25,
                            height: 25,
                            margin: 10,
                            tintColor: isDarkMode ? Colors.white : Colors.dark
                        }} />
                </TouchableOpacity> : null}

            <View style={{ marginBottom: 7 }}>
                {elem}
            </View>
            <View style={{ marginTop: 7, paddingBottom: insets.bottom }}>
                <Button
                    title={translations[done ? 'done' : 'continue'].toUpperCase()}
                    onPress={onPress}
                    color={Colors.themeColor} />
            </View>
        </View>;

    return (
        <ScrollView
            ref={scrollRef}
            style={styling.flexer}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate={'fast'}
            snapToInterval={windowWidth}
            disableIntervalMomentum>
            {dateOff
                ? null
                : renderChild({
                    elem:
                        <DatePicker
                            date={date}
                            mode="date"
                            locale={lang}
                            theme={isDarkMode ? 'dark' : 'light'}
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onDateChange={d => {
                                console.log('date:', d + '');
                                setDate(d);
                            }} />,
                    done: timeOff,
                    onPress: () => {
                        if (timeOff) {
                            date.setHours(0, 0, 0, 0);
                            onComplete(date.getTime());
                        } else {
                            scrollRef.current.scrollTo({ x: windowWidth, animated: true });
                        }
                    }
                })}

            {timeOff
                ? null
                : renderChild({
                    elem:
                        <DatePicker
                            date={time}
                            mode="time"
                            theme={isDarkMode ? 'dark' : 'light'}
                            minimumDate={
                                (minimumDate &&
                                    date.getDate() <= minimumDate.getDate() &&
                                    date.getMonth() <= minimumDate.getMonth() &&
                                    date.getFullYear() <= minimumDate.getFullYear()) ?
                                    minimumDate : undefined
                            }
                            maximumDate={
                                (maximumDate &&
                                    date.getDate() >= maximumDate.getDate() &&
                                    date.getMonth() >= maximumDate.getMonth() &&
                                    date.getFullYear() >= maximumDate.getFullYear()) ?
                                    maximumDate : undefined
                            }
                            onDateChange={t => {
                                console.log('time:', t + '');
                                setTime(t);
                            }} />,
                    done: true,
                    onPress: () => {
                        date.setHours(0, 0, 0, 0);
                        onComplete(
                            (dateOff ? 0 : date.getTime()) +
                            (time.getHours() * one_hour) + (time.getMinutes() * one_minute)
                        );
                    },
                    onPressBack:
                        dateOff
                            ? undefined
                            : () => {
                                scrollRef.current.scrollTo({ x: 0, animated: true });
                            }
                })}
        </ScrollView>
    );
}

const styling = {
    flexer: { flex: 1 },

    backBtn: {
        position: 'absolute',
        top: 0,
        left: 0,
        paddingLeft: 5
    }
};

export const openDatePicker = ({ date, onDate, maximumValue, minimumValue, dateOff, timeOff }) => {
    app_navigator.navigate('DatePickerModalScreen', {
        date, onDate, maximumValue, minimumValue, dateOff, timeOff
    });
}