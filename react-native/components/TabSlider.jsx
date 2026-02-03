import { Animated, FlatList, Text, TouchableOpacity, useAnimatedValue, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { themeStyle, useStyle } from "./../page_helper";

const plusArray = (arr = []) => arr.reduce((prev, v) => prev + v, 0);

export default function ({
    tabs = [],
    tabBarStyle,
    renderItem,
    indicatorColor,
    windowWidth,
    renderAfterTabBar,
    renderBeforeTabBar,
    tabIndex = 0,
    onTabIndexChange
}) {
    const { isDarkMode, windowWidth: vw, styles } = useStyle(styling);
    if (windowWidth === undefined) windowWidth = vw;

    const [currentSlide, setCurrentSlide] = useState(tabIndex);
    const [__, refreshState] = useState();

    const initialIndex = useRef(tabIndex);
    const tarBarSlideRef = useRef();
    const containerSlideRef = useRef();
    const tabLayouts = useRef([]);
    const slideReducer = useRef();

    const scrollX = useAnimatedValue(0);

    const useStatic = tabLayouts.current.length < 2 ||
        [...tabLayouts.current].some(v => isNaN(v));

    const inputRange = useStatic ? [0, 1] : tabLayouts.current.map((_, i) => i * windowWidth);

    const indicatorWidths = useStatic ? [0, 0] : tabLayouts.current.map(v => v || 0);
    const indicatorOffsets = useStatic ? [0, 0] : tabLayouts.current.map((_, i, a) => plusArray(a.slice(0, i)));

    const indicatorWidth = scrollX.interpolate({
        inputRange,
        outputRange: indicatorWidths,
        extrapolate: 'clamp',
    });

    const indicatorTranslateX = scrollX.interpolate({
        inputRange,
        outputRange: indicatorOffsets,
        extrapolate: 'clamp',
    });

    const onSlideChanged = useMemo(() => ({ viewableItems }) => {
        clearTimeout(slideReducer.current);

        slideReducer.current = setTimeout(() => {
            if (!viewableItems.length) return;
            setCurrentSlide(viewableItems[0].index);
        }, 500);
    }, []);
    const slideConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

    useEffect(() => {
        tarBarSlideRef.current?.scrollToIndex?.({
            animated: true,
            index: currentSlide,
            ...(currentSlide && currentSlide !== tabs.length - 1) ? { viewOffset: windowWidth * .25 } : {}
        });
        containerSlideRef.current?.scrollToIndex?.({ animated: true, index: currentSlide });
    }, [currentSlide, windowWidth, useStatic]);

    useEffect(() => {
        if (Number.isInteger(tabIndex))
            setCurrentSlide(tabIndex);
    }, [tabIndex]);

    useEffect(() => {
        onTabIndexChange?.(currentSlide);
    }, [currentSlide]);

    const tabbarConStyle = useMemo(() => {
        return [{ height: 45 }, tabBarStyle];
    }, [tabBarStyle]);

    const slideItemConStyle = useMemo(() => {
        return { width: windowWidth, height: '100%' };
    }, [windowWidth]);

    const indicatorStyle = useMemo(() => {
        return [
            {
                width: useStatic ? '100%' : indicatorWidth,
                height: 3,
                position: 'absolute',
                bottom: 0,
                backgroundColor: indicatorColor || 'burlywood',
                borderRadius: 15
            },
            useStatic ? { left: 0 } : { transform: [{ translateX: indicatorTranslateX }] }
        ];
    }, [useStatic, indicatorWidth, indicatorColor, indicatorTranslateX]);

    return (
        <View style={styles.flexer}>
            {renderBeforeTabBar?.() || null}
            <View style={tabbarConStyle}>
                <FlatList
                    style={styles.flexer}
                    ref={tarBarSlideRef}
                    initialNumToRender={tabs.length}
                    getItemLayout={(_, index) => ({
                        index,
                        length: tabLayouts.current[index],
                        offset: plusArray(tabLayouts.current.slice(0, index))
                    })}
                    windowSize={tabs.length}
                    removeClippedSubviews={false}
                    data={tabs}
                    renderItem={({ item, index }) =>
                        <View style={styles.tabbarItemCon}>
                            <TouchableOpacity
                                style={currentSlide === index ? styles.tabbarBtnFocused : styles.tabbarBtnBlurred}
                                disabled={currentSlide === index}
                                onPress={() => {
                                    setCurrentSlide(index);
                                }}
                                onLayout={e => {
                                    const { width } = e.nativeEvent.layout;
                                    tabLayouts.current[index] = width;
                                    refreshState({});
                                }}>
                                <Text
                                    allowFontScaling={false}
                                    style={styles.tabTxt}
                                    numberOfLines={1}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                            {index ? null : <Animated.View style={indicatorStyle} />}
                        </View>
                    }
                    keyExtractor={(_, index) => index}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                />
            </View>
            {renderAfterTabBar?.() || null}
            <FlatList
                style={styles.flexer}
                ref={containerSlideRef}
                data={tabs}
                scrollEventThrottle={16}
                onScroll={
                    Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )
                }
                initialScrollIndex={initialIndex.current}
                onScrollToIndexFailed={e => {
                    console.log('TabSlider onScrollToIndexFailed:', e);
                }}
                getItemLayout={(_, index) => ({ index, length: windowWidth, offset: windowWidth * index })}
                renderItem={({ index }) =>
                    <View style={slideItemConStyle}>
                        {renderItem?.(index) || null}
                    </View>
                }
                keyExtractor={(_, index) => index}
                onViewableItemsChanged={onSlideChanged}
                viewabilityConfig={slideConfig}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate={"fast"}
                snapToInterval={windowWidth}
                horizontal
                disableIntervalMomentum
            />
        </View>
    );
};

const CommonTabBtnStyle = {
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
};

const styling = {
    flexer: { flex: 1 },

    tabbarItemCon: { height: '100%' },

    tabTxt: {
        fontWeight: 'bold',
        fontSize: 15,
        color: themeStyle('white', 'black'),
        maxWidth: 200
    },

    tabbarBtnFocused: {
        ...CommonTabBtnStyle,
    },

    tabbarBtnBlurred: {
        ...CommonTabBtnStyle,
        opacity: 0.5
    }
};