import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useSpring, animated } from '@react-spring/web';
import { DragGesture } from '@use-gesture/vanilla';

export default forwardRef(({
    handle,
    handleRef,
    onDrag,
    releaseDuration = 500,
    initXY = [50, 50],
    children,
    ...restProps
}, ref) => {
    const [{ y: yRef, x: xRef }, api] = useSpring(() => ({
        from: { y: initXY[1], x: initXY[0] }
    }));

    const dragListener = useRef(),
        lastOffset = useRef([initXY[0], initXY[1]]);

    useImperativeHandle(ref, () => ({
        drag: ({ immediate = true, y, x, ...rest }) => {
            api.start({
                to: { y, x },
                immediate,
                ...rest
            });
            lastOffset.current = [rest.x, rest.y];
        }
    }));

    dragListener.current = ({ active, xy: [mx, my], delta, offset }) => {
        let preventIt;

        onDrag?.({
            active,
            xy: [mx, my],
            offset,
            delta,
            preventDefault: () => { preventIt = true; }
        });
        if (preventIt) return;
        const [lx, ly] = lastOffset.current,
            [x, y] = [lx + delta[0], ly + delta[1]];

        api.start({
            to: { y, x },
            immediate: true
        });
        lastOffset.current = [x, y];
    };

    useEffect(() => {
        const el = handle ? document.querySelector(handle) : handleRef.current;
        const gesture = new DragGesture(el, p => dragListener.current(p));

        return () => {
            gesture.destroy();
        }
    }, [handle, handleRef]);

    return (
        <animated.div {...restProps}
            style={{ ...restProps?.style, top: yRef, left: xRef }}>
            {children}
        </animated.div>
    );
});