import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Image, ScrollView, TouchableOpacity, View } from "react-native";
import { PlainModalBG, ModalScreen, MaxModalWidth } from "./AppModal";
import { alertNull, themeStyle, useStyle } from "../page_helper";
import WheelPicker, { DatePicker } from '@quidone/react-native-wheel-picker';
import WheelPickerFeedback from '@quidone/react-native-wheel-picker-feedback';
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
                modalHeight={320 + insets.bottom}
                keyboardDodgingBehaviour="off">
                <Template
                    dodge_keyboard_scan_off
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
    const { styles, windowWidth, isDarkMode } = useStyle(styling);
    const { translations, lang } = useTranslation();

    const [date, setDate] = useState(() => initDate ? new Date(initDate) : new Date());
    const [time, setTime] = useState(() => new Date(date));
    const [index, setIndex] = useState(0);

    const scrollRef = useRef();

    const scrollWidth = Math.min(MaxModalWidth, windowWidth);

    const getMinDate = () =>
        (minimumValue instanceof Date || Number.isInteger(minimumValue))
            ? new Date(minimumValue)
            : minimumValue === undefined
                ? new Date()
                : undefined;

    const getMaxDate = () =>
        (maximumValue instanceof Date || Number.isInteger(maximumValue))
            ? new Date(maximumValue)
            : undefined;

    const minimumDate = getMinDate();

    const maximumDate = getMaxDate();

    console.log('minimumDate:', date.toLocaleDateString(), ' toLoc:', toDateString(date));

    const onDone = (millis) => {
        if (minimumValue === undefined) {
            const min = getMinDate();

            const time =
                timeOff ? 0 :
                    (min.getHours() * one_hour +
                        min.getMinutes() * one_minute);

            const date = time + (dateOff ? 0 : min.setHours(0, 0, 0, 0));

            if (millis < date) {
                alertNull('Select Future Time', 'Selected time has already past, kindly select a future time');
                return;
            }
        }

        onComplete(millis);
    }

    const renderChild = ({ elem, onPress, done, onPressBack }) =>
        <View style={{
            width: scrollWidth,
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
                            tintColor: isDarkMode ? 'white' : 'black'
                        }} />
                </TouchableOpacity> : null}

            <View style={{ paddingHorizontal: 15 }}
                scroll_anchor_snap_avoid>
                {elem}
            </View>
            <View style={{ paddingTop: 7, paddingBottom: insets.bottom + 7, width: '80%', alignItems: 'center' }}
                scroll_anchor_snap_avoid>
                <View style={{ paddingHorizontal: 15 }}>
                    <Button
                        title={`   ${translations[done ? 'done' : 'continue'].toUpperCase()}   `}
                        onPress={onPress}
                        color={Colors.themeColor} />
                </View>
            </View>
        </View>;

    const ThisFeedback = index === 0 ? feedback : undefined;

    return (
        <ScrollView
            ref={scrollRef}
            style={styling.flexer}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate={'fast'}
            snapToInterval={scrollWidth}
            disableIntervalMomentum
            onScroll={e => {
                setIndex(Math.round(e.nativeEvent.contentOffset.x / scrollWidth));
            }}>
            {dateOff
                ? null
                : renderChild({
                    elem:
                        <DatePicker
                            dodge_keyboard_scan_off
                            date={toDateString(date)}
                            locale={lang}
                            minDate={toDateString(minimumDate)}
                            maxDate={toDateString(maximumDate)}
                            enableScrollByTapOnItem
                            overlayItemStyle={isDarkMode ? { backgroundColor: 'white' } : undefined}
                            itemTextStyle={styles.pickerItemTxt}
                            renderDate={() => (
                                <DatePicker.Date onValueChanging={ThisFeedback} />
                            )}
                            renderMonth={() => (
                                <DatePicker.Month onValueChanging={ThisFeedback} />
                            )}
                            renderYear={() => (
                                <DatePicker.Year onValueChanging={ThisFeedback} />
                            )}
                            onDateChanged={d => {
                                console.log('date:', d.date);
                                setDate(new Date(d.date));
                            }} />,
                    done: timeOff,
                    onPress: () => {
                        if (timeOff) {
                            date.setHours(0, 0, 0, 0);
                            onDone(date.getTime());
                        } else {
                            scrollRef.current.scrollTo({ x: scrollWidth, animated: true });
                        }
                    }
                })}

            {timeOff
                ? null
                : renderChild({
                    elem:
                        <TimeWheel
                            index={index}
                            dodge_keyboard_scan_off
                            isDarkMode={isDarkMode}
                            locale={lang}
                            value={time}
                            min={
                                (minimumDate &&
                                    date.getDate() <= minimumDate.getDate() &&
                                    date.getMonth() <= minimumDate.getMonth() &&
                                    date.getFullYear() <= minimumDate.getFullYear()) ?
                                    minimumDate : undefined
                            }
                            max={
                                (maximumDate &&
                                    date.getDate() >= maximumDate.getDate() &&
                                    date.getMonth() >= maximumDate.getMonth() &&
                                    date.getFullYear() >= maximumDate.getFullYear()) ?
                                    maximumDate : undefined
                            }
                            onValue={v => {
                                console.log('time:', v);
                                const time = new Date(v);
                                time.setHours(0, 0, 0, v);
                                setTime(time);
                            }} />,
                    done: true,
                    onPress: () => {
                        date.setHours(0, 0, 0, 0);
                        onDone(
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
};

const toDateString = (date) =>
    date instanceof Date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        : undefined;

const feedback = () => {
    WheelPickerFeedback.triggerSoundAndImpact();
}

const styling = {
    flexer: { flex: 1 },

    backBtn: {
        position: 'absolute',
        top: 0,
        left: 0,
        paddingLeft: 5
    },

    pickerItemTxt: {
        color: themeStyle('black', 'white')
    }
};

const HOURS =
    Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: String(i + 1)
    }));

const HOURS_24 =
    Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: String(i).padStart(2, '0')
    }));

const MINUTES =
    Array.from({ length: 60 }, (_, i) => ({
        value: i,
        label: String(i).padStart(2, '0')
    }));

const PERIODS = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
];

const TimeWheel = ({ value, onValue, min, max, isDarkMode, locale, index }) => {

    const { is12Hours, hh, mm, init_period } =
        useMemo(() => {
            const is12Hours = uses12HourClock(locale);
            const time =
                value === undefined || value === null
                    ? new Date()
                    : new Date(value);
            let hh = time.getHours();
            let mm = time.getMinutes();
            let init_period;

            if (is12Hours) {
                init_period = PERIODS[hh >= 12 ? 1 : 0].value;
                hh = hh % 12;
                if (hh === 0) hh = 12;
            }

            return { is12Hours, hh, mm, init_period };
        }, []);

    const [hour, setHour] = useState(hh);
    const [minute, setMinute] = useState(mm);
    const [period, setPeriod] = useState(init_period);
    const [refresher, setRefresher] = useState();

    const textStyle =
        useMemo(() => ({
            color: isDarkMode ? 'white' : 'black'
        }), [isDarkMode]);

    const { minTime, maxTime } =
        useMemo(() => {
            let minTime, maxTime;

            if (min !== undefined && min !== null) {
                minTime = new Date(min);
                minTime = [minTime.getHours(), minTime.getMinutes()];
                minTime[2] = minTime[0] * one_hour + minTime[1] * one_minute;
            }

            if (max !== undefined && max !== null) {
                maxTime = new Date(max);
                maxTime = [maxTime.getHours(), maxTime.getMinutes()];
                maxTime[2] = maxTime[0] * one_hour + maxTime[1] * one_minute;
            }

            return { minTime, maxTime };
        }, [min, max]);

    const getDayTime = (h = hour, m = minute, p = period) =>
        (h * one_hour) + (m * one_minute) + (is12Hours ? p === PERIODS[1].value ? (12 * one_hour) : 0 : 0);

    useEffect(() => {
        const now = getDayTime();
        const retime = (time) => {
            const h = time[0];

            console.log('retime now:', now, ' re:', time);
            if (is12Hours) {
                const d = h % 12;
                setHour(d === 0 ? 12 : d);
                setPeriod(PERIODS[h >= 12 ? 1 : 0].value);
            } else setHour(h);
            setMinute(time[1]);
        }

        if (minTime !== undefined && now < minTime[2]) {
            retime(minTime);
            return;
        }

        if (maxTime !== undefined && now > maxTime[2]) {
            retime(maxTime);
            return;
        }
    }, [minTime, maxTime, hour, minute, period]);

    useEffect(() => {
        onValue?.(getDayTime());
    }, [hour, minute, period, refresher]);

    const overlayItemStyle = isDarkMode ? { backgroundColor: 'white' } : undefined;

    const extras = {
        width: 80,
        itemTextStyle: textStyle,
        enableScrollByTapOnItem: true,
        onValueChanging: index === 1 ? feedback : undefined
    };

    return (
        <View style={styles.pickers}>
            <WheelPicker
                {...extras}
                data={is12Hours ? HOURS : HOURS_24}
                value={hour}
                overlayItemStyle={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, ...overlayItemStyle }}
                onValueChanged={({ item }) => {
                    const now = getDayTime(item.value);
                    const retime = (time) => {
                        const h = time[0];

                        if (is12Hours) {
                            const d = h % 12;
                            time = d === 0 ? 12 : d;
                        } else time = h;

                        setHour(time);
                        if (time === hour) setRefresher({});
                    }

                    if (minTime !== undefined && now < minTime[2]) {
                        retime(minTime);
                        return;
                    }

                    if (maxTime !== undefined && now > maxTime[2]) {
                        retime(maxTime);
                        return;
                    }

                    setHour(item.value);
                }}
            />

            <WheelPicker
                {...extras}
                data={MINUTES}
                value={minute}
                overlayItemStyle={{ borderRadius: 0, ...overlayItemStyle }}
                onValueChanged={({ item }) => {
                    const now = getDayTime(undefined, item.value);
                    const retime = time => {
                        setMinute(time[1]);
                        if (time[1] === minute) setRefresher({});
                        console.log('reMinute time:', time[1], ' minute:', minute);
                    }

                    if (minTime !== undefined && now < minTime[2]) {
                        retime(minTime);
                        return;
                    }

                    if (maxTime !== undefined && now > maxTime[2]) {
                        retime(maxTime);
                        return;
                    }

                    console.log('good minutes:', item.value);
                    setMinute(item.value);
                }}
            />

            {is12Hours ?
                <WheelPicker
                    {...extras}
                    data={PERIODS.map((v, i) => ({ ...v, label: is12Hours[i] }))}
                    value={period}
                    overlayItemStyle={{ ...overlayItemStyle, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                    onValueChanged={({ item }) => {
                        const now = getDayTime(undefined, undefined, item.value);

                        const reperiod = (p) => {
                            setPeriod(p);
                            if (p === period) setRefresher({});
                        }

                        if (minTime !== undefined && now < minTime[2]) {
                            reperiod(PERIODS[1].value);
                            return;
                        }

                        if (maxTime !== undefined && now > maxTime[2]) {
                            reperiod(PERIODS[0].value);
                            return;
                        }

                        setPeriod(item.value);
                    }}
                /> : null}
        </View>
    );
}

const Locale_12h = {
    en: true,
    zh: ['上午', '下午'],
    hi: true,
    bn: true,
    ar: true,
    ja: ['午前', '午後'],
    ko: ['오전', '오후'],
    th: true,
    id: true,
    ms: true,
    tl: true,
    he: true,
    fa: true,
    sw: true,
    el: ['πμ', 'μμ']
};

const uses12HourClock = (lang) => {
    lang = Locale_12h[lang];
    if (lang) {
        if (lang === true) return PERIODS.map(v => v.label);
        return lang;
    }
};

const styles = {
    pickers: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }
};

export const openDatePicker = ({ date, onDate, maximumValue, minimumValue, dateOff, timeOff }) => {
    app_navigator.navigate('DatePickerModalScreen', {
        date, onDate, maximumValue, minimumValue, dateOff, timeOff
    });
};