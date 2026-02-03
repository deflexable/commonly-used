import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Pressable, useWindowDimensions, FlatList, Text, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ({
    list = [],
    selectedIndex = 0,
    onSelected,
    selectedColor = 'rgba(152, 186, 255, 1)',
    rowHeight,
    style,
    children,
    renderChildren,
    renderListRow,
    seperatorColor = 'gray',
    keyExtractor,
    listContainerStyle,
    statusBarTranslucent = true,
    onOpened,
    onClosed
}) {
    if (rowHeight !== undefined && !(rowHeight > 0))
        throw new Error(`rowHeight must be a positive number greater than 0 but got ${rowHeight}`);
    if (!Array.isArray(list) || !list.length)
        throw new Error('list must be a non-empty array');
    if (!Number.isInteger(selectedIndex))
        throw new Error('selectedIndex must be a postive integer');
    if (selectedIndex < 0 || selectedIndex >= list.length)
        throw new Error(`selectedIndex is out of range, expected within range 0 - ${list.length - 1} but got ${selectedIndex}`)

    const [dim, setDim] = useState();
    const [pos, setPos] = useState();
    const [showDropper, setShowDropper] = useState();

    const [width, height] = dim || [];
    const [posX, posY] = pos || [];
    const { top, bottom } = useSafeAreaInsets();
    const { height: vh } = useWindowDimensions();

    const mountedOpened = useRef();

    useEffect(() => {
        if (mountedOpened.current)
            if (showDropper) {
                onOpened?.();
            } else onClosed?.();
        mountedOpened.current = true;
    }, [!showDropper]);

    if (rowHeight === undefined) rowHeight = height;

    const dropUp = useMemo(() => pos && posY >= vh * .68, [vh, posY]);

    const listHeight = useMemo(() =>
        pos && dim && Math.min(rowHeight * list.length, (dropUp ? posY : (vh - (posY + height))) - ((dropUp ? top : bottom) + 10)),
        [rowHeight, vh, list.length, dropUp, height, posY, top, bottom]
    );

    const conStyle = useMemo(() => ({
        ...styling.con,
        ...StyleSheet.flatten(style)
    }), [style]);

    const [listItemBtnStyle, listItemSelectedBtnStyle] = useMemo(() =>
        Array(2).fill({ height: rowHeight, justifyContent: 'center' })
            .map((v, i) => (i && selectedColor) ? ({ ...v, backgroundColor: selectedColor }) : v),
        [selectedColor, rowHeight]
    );

    const seperatorStyle = useMemo(() => ({
        position: 'absolute',
        width: '100%',
        height: 1,
        bottom: -.5,
        backgroundColor: seperatorColor
    }), [seperatorColor]);

    if (!renderChildren)
        renderChildren = (v) =>
            <View style={styling.buttonCon}>
                <Text style={styling.txt}>
                    {`${v}`}
                </Text>
            </View>;

    if (!renderListRow)
        renderListRow = v =>
            <Text style={styling.txt}>
                {`${v}`}
            </Text>;

    const renderDropMenu = () =>
        <View
            style={{
                position: 'absolute',
                width,
                height: listHeight,
                top: dropUp ? posY - listHeight : posY + height,
                left: posX,
                zIndex: 9,
                backgroundColor: 'rgba(241, 241, 241, 1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 10,
                ...listContainerStyle
            }}>
            <FlatList
                ref={dropListRef}
                style={styling.flexer}
                data={list}
                keyExtractor={keyExtractor || (item => item)}
                {...(initOffset > 0 && scrollHeight > 0)
                    ? initOffset >= scrollHeight
                        ? { initialScrollIndex: selectedIndex }
                        : { contentOffset: { x: 0, y: initOffset } }
                    : {}}
                getItemLayout={(_, index) => ({ index, length: rowHeight, offset: rowHeight * index })}
                onScrollToIndexFailed={() => null}
                renderItem={({ item, index }) => {
                    const isSelected = index === selectedIndex;

                    return (
                        <Pressable
                            style={isSelected ? listItemSelectedBtnStyle : listItemBtnStyle}
                            onPress={() => {
                                setShowDropper(false);
                                onSelected?.(item, index);
                            }}>
                            {renderListRow(item, index, isSelected)}
                            {seperatorColor ? <View style={seperatorStyle} /> : null}
                        </Pressable>
                    );
                }} />
        </View>;

    const willShowMenu = !!(showDropper && pos && dim);

    const initOffset = useMemo(() =>
        ((rowHeight * selectedIndex) - (listHeight * .5)) + (rowHeight * .5),
        [willShowMenu]
    );

    const scrollHeight = useMemo(() =>
        (rowHeight * list.length) - listHeight,
        [willShowMenu]
    );

    const dropListRef = useRef();

    useEffect(() => {
        if (
            willShowMenu &&
            dropListRef.current
        ) {
            const s = Math.min(scrollHeight, Math.max(0, initOffset));

            [1, 0].forEach(e => {
                dropListRef.current.scrollToOffset({
                    offset: s - e,
                    animated: false
                });
            });
        }
    }, [willShowMenu]);

    return (
        <View
            style={conStyle}
            onLayout={e => {
                const { width, height } = e.nativeEvent.layout;
                setDim([width, height]);
            }}>
            {children || renderChildren(list[selectedIndex])}
            {showDropper ?
                (pos && dim) ?
                    <Modal
                        onRequestClose={() => {
                            setShowDropper(false);
                        }}
                        statusBarTranslucent={statusBarTranslucent}
                        supportedOrientations={['portrait', 'landscape']}
                        animationType="none"
                        transparent={true}
                        visible={true}>
                        <Pressable
                            style={styling.flexer}
                            onPress={() => {
                                setShowDropper(false);
                            }} />
                        {renderDropMenu()}
                    </Modal> : null
                :
                <Pressable
                    style={styling.prefillBtn}
                    onPress={e => {
                        const { pageX, locationX, pageY, locationY } = e.nativeEvent;
                        setPos([pageX - locationX, pageY - locationY]);
                        setShowDropper(true);
                    }} />}
        </View>
    );
}

const styling = {
    flexer: { flex: 1 },

    con: {
        // backgroundColor: 'rgb(245, 247, 249)',
        // height: 40,
        // borderRadius: 5,
        // zIndex: 9
    },

    buttonCon: { justifyContent: 'center', height: '100%' },

    txt: { marginHorizontal: 7 },

    prefillBtn: {
        position: 'absolute',
        width: '100%',
        height: '100%'
    }
};