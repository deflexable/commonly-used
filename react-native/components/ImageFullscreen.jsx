import { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Image,
    Animated,
    PanResponder,
    StyleSheet,
    useAnimatedValue,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { AppTitleBar } from './AppBars';
import { Back } from '@this_app_root/src/utils/assets';
import { Colors } from '@this_app_root/src/utils/values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { devTransformLocalhostURL, optimizeImage, shouldCover, useStyle } from './../page_helper.js';

export default function ({ route: { params: { item = [], initialIndex } }, navigation }) {
    const { top: statusHeight } = useSafeAreaInsets();
    const { windowHeight, windowWidth } = useStyle();

    const initList = useMemo(() => {
        return (Array.isArray(item) ? item : [item]).map(v =>
            typeof v === 'string' ? { src: v } : v
        );
    }, []);

    const [list, setList] = useState(initList);
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

    const scrollRef = useRef();
    const scrollerReducer = useRef();
    const instantImageSizing = useRef([]);

    const results = useMemo(() => {
        return list.map(v => ({
            ...v,
            ...v.dim ? { cover: shouldCover(v.dim, [windowWidth, windowHeight], .3) } : undefined
        }));
    }, [list, windowWidth, windowHeight]);

    const [maxOpacity, dismissThreshold] = useMemo(() => {
        return [windowHeight * .6, Math.min(windowHeight * .2, 200)];
    }, []);

    const translateY = useAnimatedValue(0);
    const opacity = translateY.interpolate({
        inputRange: [-maxOpacity, 0, maxOpacity],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
    });

    const panResponder = useMemo(() =>
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const dragDistance = gestureState.dy;

                if (Math.abs(dragDistance) > dismissThreshold) {
                    const finalY = dragDistance > 0 ? windowHeight : -windowHeight;
                    Animated.timing(translateY, {
                        toValue: finalY,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        navigation.goBack();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            }
        }),
        [navigation, windowHeight]
    );

    const renderAppBar = () =>
        <View style={{ position: 'absolute', width: '100%', paddingTop: statusHeight, zIndex: 1 }}>
            <AppTitleBar
                hideBanner={true}
                backgroundColor={Colors.transparent}
                leading={
                    <TouchableOpacity
                        style={[styles.titleBtn, { marginLeft: 15 }]}
                        onPress={() => {
                            navigation.goBack();
                        }}>
                        <Image
                            style={styles.titleBarIcon}
                            source={Back}
                        />
                    </TouchableOpacity>
                }
            />
        </View>

    const itemConStyle = useMemo(() => {
        return { width: windowWidth, height: '100%' };
    }, [windowWidth]);

    const renderItem = (v, i) =>
        <View
            key={i}
            style={itemConStyle}>
            {(instantImageSizing.current[i] || (Math.abs(i - currentIndex) <= 2)) ?
                <Image
                    source={{ uri: optimizeImage(v.src, null) }}
                    loadingIndicatorSource={
                        v.placeholder ?
                            { uri: devTransformLocalhostURL(v.placeholder) } : undefined
                    }
                    resizeMode={v.cover ? 'cover' : 'contain'}
                    style={styles.imageContent}
                    onLoad={e => {
                        const { width, height } = e.nativeEvent.source;
                        instantImageSizing.current[i] = [width, height];
                        setList(list.map((v, x) => ({ ...v, dim: instantImageSizing.current[x] || v.dim })));
                    }} /> : null}
        </View>;

    useEffect(() => {
        if (initialIndex)
            scrollRef.current.scrollTo({ x: windowWidth * initialIndex, animated: false });
    }, []);

    console.log('mounted: ', results, ' currentIndex:', currentIndex);
    return (
        <View style={styles.flexer}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ translateY }],
                        opacity
                    }
                ]}
                {...panResponder.panHandlers}>
                {renderAppBar()}
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.scroller}
                    decelerationRate={'fast'}
                    snapToInterval={windowWidth}
                    snapToAlignment='start'
                    scrollEventThrottle={30}
                    onScroll={e => {
                        const { x } = e.nativeEvent.contentOffset;

                        clearTimeout(scrollerReducer.current);
                        scrollerReducer.current = setTimeout(() => {
                            setCurrentIndex(Math.round(x / windowWidth));
                        }, 300);
                    }}>
                    {results.map(renderItem)}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    flexer: { flex: 1 },

    container: {
        flex: 1,
        backgroundColor: 'black',
    },

    titleBtn: {
        backgroundColor: Colors.darkTransparent,
        borderRadius: 50
    },

    titleBarIcon: {
        margin: 10,
        width: 20,
        height: 20,
        tintColor: Colors.white
    },

    scroller: { flex: 1 },

    imageContent: { width: '100%', height: '100%' }
});
