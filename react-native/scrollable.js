
/**
 * @type {(callback: import('react-native').ScrollViewProps['onScroll'], offset: number) => Function}
 */
export const useScrollViewPagination = (callback, offset = 100) => {

    return e => {
        const {
            contentOffset: { y },
            contentSize: { height },
            layoutMeasurement: { height: layHeight }
        } = e.nativeEvent;
        const hasReachDown = y + layHeight + offset >= height;
        if (hasReachDown) callback(e);
    }
};

/**
 * @type {(callback: (index: number) => void, childrenRefs: []) => import('react-native').ScrollViewProps['onScroll']}
 */
export const handleScrollViewChildrenVisibility = (callback, childrenRefs) => {
    return event => {
        const {
            nativeEvent: { contentOffset: { y }, layoutMeasurement: { height } }
        } = event;

        childrenRefs.forEach((e, i) => {
            if (e) {
                e.measureLayout(event.currentTarget, (_, fixedY, _w, itemHeight) => {
                    const isVisible = y >= (fixedY - height) && y <= fixedY + itemHeight;
                    if (isVisible) callback(i);
                });
            }
        });
    };
};