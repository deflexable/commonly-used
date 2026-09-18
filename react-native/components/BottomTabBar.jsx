import {
    useNavigationBuilder,
    createNavigatorFactory,
    TabRouter,
    TabActions,
} from '@react-navigation/native';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

function TabNavigator({
    navigationOption,
    containerStyle,
    screenContainerStyle,
    barContainerStyle,
    barItemStyle,
    barBottomPlacement = true,
    renderBarItem,
    renderBarItemStart,
    renderBarItemEnd,
    onScreenFocused,
    children
}) {
    const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(TabRouter, { ...navigationOption, children });

    const mountedScreens = useMemo(() => new Set(), []);
    const mountedFocus = useRef();

    useEffect(() => {
        if (mountedFocus.current) {
            onScreenFocused?.({ route: state.routes[state.index], index: state.index });
        }
        mountedFocus.current = true;
    }, [state.index]);

    const renderBar = () =>
        <TabBarPlacement
            state={state}
            navigation={navigation}
            style={barContainerStyle}
            itemStyle={barItemStyle}
            renderBarItem={renderBarItem}
            renderBarItemStart={renderBarItemStart}
            renderBarItemEnd={renderBarItemEnd}
        />;

    const [screenStyleActive, screenStyleInActive] = useMemo(() => {
        const flattenStyle = StyleSheet.flatten(screenContainerStyle);

        return [
            {
                flex: 1,
                ...flattenStyle
            },
            {
                flex: 1,
                ...flattenStyle,
                display: 'none',
                opacity: 0,
                zIndex: -999
            }
        ];
    }, [screenContainerStyle]);

    return (
        <NavigationContent>
            <View style={containerStyle || styling.flexer}>
                {barBottomPlacement ? null : renderBar()}

                {state.routes.map((route, index) => {
                    const descriptor = descriptors[route.key];
                    const isFocused = state.index === index;

                    if (isFocused) mountedScreens.add(route.key);

                    if (mountedScreens.has(route.key))
                        return (
                            <View
                                key={route.key}
                                style={isFocused ? screenStyleActive : screenStyleInActive}>
                                {descriptor.render()}
                            </View>
                        );
                    return null;
                })}

                {barBottomPlacement ? renderBar() : null}
            </View>
        </NavigationContent>
    );
}

export const createFlexibleTab = createNavigatorFactory(TabNavigator);

function TabBarPlacement({ state, navigation, style, itemStyle, renderBarItem, renderBarItemStart, renderBarItemEnd }) {

    return (
        <View style={style || styling.barCon}>
            {state.routes.map((route, index) => {
                const focused = state.index === index;

                return (
                    <Fragment key={route.key}>
                        {renderBarItemStart?.({ route, focused, index })}
                        <TouchableOpacity
                            style={itemStyle || styling.barItem}
                            onPress={() => {
                                navigation.dispatch({
                                    ...TabActions.jumpTo(route.name),
                                    target: state.key
                                });
                            }}>
                            {renderBarItem?.({ route, focused, index })}
                        </TouchableOpacity>
                        {renderBarItemEnd?.({ route, focused, index })}
                    </Fragment>
                );
            })}
        </View>
    );
}

const styling = {
    flexer: { flex: 1 },

    barCon: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: 'white'
    },

    barItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
};