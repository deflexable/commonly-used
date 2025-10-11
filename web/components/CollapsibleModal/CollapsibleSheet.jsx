import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { DragGesture } from '@use-gesture/vanilla';
import { useBodyScrollBlocker } from '../../methods';

const CollapsibleSheet = forwardRef(({
    handle,
    handleRef: handleRefX,
    children,
    snapThreshold = 0.45,
    snapDuration = 300,
    onDrag,
    defaultOpen,
    backdropColor,
    renderBackdrop,
    disableBackdropClose,
    onClosed,
    onOpened,
    fillParent,
    containerClass,
    containerStyle,
    contentClass
}, ref) => {
    const [snap, setSnap] = useState(0),
        [isOpened, setOpened] = useState(!!defaultOpen),
        [ancestorHeight, setAncestorHeight] = useState(),
        [descendantHeight, setDescendantHeight] = useState(),
        [blockScroll, setBlockScroll] = useState(!!isOpened);

    const hasHandleInit = useRef(),
        springReducer = useRef(),
        dragListener = useRef(),
        mountedOpener = useRef(),
        ancestorRef = useRef(),
        descendantRef = useRef(),
        handleRef = handleRefX || useRef(),
        instantDescendantHeightListener = useRef();

    const [{ y }, api] = useSpring(() => ({
        from: { y: 0 }
    }));

    const getFlingDuration = (fy) => ((snapDuration * (Math.max(snap, fy) - Math.min(snap, fy))) / descendantHeight);

    const refMethods = {
        open: (force) => {
            if (!isOpened || force) {
                const delay = force ? undefined : getFlingDuration(0);
                api.start({
                    to: { y: 0 },
                    immediate: force || false,
                    config: { duration: delay }
                });
                setOpened(true);
                updateSnap(0, delay);
            }
        },
        close: (force) => {
            if ((isOpened && !isNaN(descendantHeight)) || force) {
                const delay = force ? undefined : getFlingDuration(-descendantHeight);
                api.start({
                    to: { y: -descendantHeight },
                    immediate: force || false,
                    config: { duration: delay }
                });
                updateSnap(-descendantHeight, delay);
            }
        },
        snapTo: (to) => {
            if (typeof to !== 'number' || isNaN(to) || to < 0 || to > 1)
                throw 'snapTo first argument must be a positive number from 0 - 1';
            if (!isNaN(descendantHeight)) return;

            const t = (descendantHeight * to) - descendantHeight,
                delay = getFlingDuration(0);

            api.start({
                to: { y: t },
                immediate: false,
                config: { duration: delay }
            });
            setOpened(t > -descendantHeight);
            updateSnap(t, delay);
        }
    };

    const updateSnap = (t, delay) => {
        // console.log('updateSnap: delay: ', delay, ' t:', t);
        clearTimeout(springReducer.current);
        if (delay) {
            springReducer.current = setTimeout(() => {
                setSnap(t);
            }, delay);
        } else setSnap(t);
    }

    useImperativeHandle(ref, () => (refMethods));

    useBodyScrollBlocker(blockScroll);

    instantDescendantHeightListener.current = h => {
        if (typeof h === 'number' && !isNaN(h)) {
            const isClosed = snap === -descendantHeight;
            setSnap(isClosed ? -h : 0);
            setDescendantHeight(h);
        }
    }

    useEffect(() => {
        const l = new ResizeObserver(r => {
            const h = r[0].contentRect.height;
            if (typeof h === 'number' && !isNaN(h))
                setAncestorHeight(h);
        });
        const l2 = new ResizeObserver(r => {
            const h = r[0].contentRect.height;
            instantDescendantHeightListener.current(h);
        });

        l.observe(ancestorRef.current);
        l2.observe(descendantRef.current);

        return () => {
            l.disconnect();
            l2.disconnect();
        }
    }, []);

    useEffect(() => {
        if (!hasHandleInit.current && typeof ancestorHeight === 'number' && typeof descendantHeight === 'number') {
            hasHandleInit.current = true;
            if (!isOpened) {
                api.start({
                    to: { y: -descendantHeight },
                    immediate: true
                });
                updateSnap(-descendantHeight);
            }
        }
        // else if (hasHandleInit.current) {
        //     if (isOpened) {
        //         refMethods.open();
        //     } else refMethods.close();
        // }
        // console.log('dimension Changed: ancesH', ancestorHeight, ' descH:', descendantHeight);
    }, [ancestorHeight, descendantHeight]);

    dragListener.current = ({ active, xy: [_, my] }) => {
        const parentEle = descendantRef.current.getBoundingClientRect(),
            childEle = (handle ? document.querySelector(handle) : handleRef.current).getBoundingClientRect(),
            conPos = (my - (childEle.top - parentEle.top)),
            posHeight = (ancestorHeight - conPos),
            pos = posHeight - descendantHeight;
        let preventIT;

        onDrag?.({
            containerPosition: conPos,
            handlerPosition: my,
            visibleHeight: posHeight,
            fullHeight: descendantHeight,
            active,
            preventDefault: () => { preventIT = true }
        });

        if (preventIT) return;
        if (active) {
            const yy = pos > 0 ? 0 : pos < -descendantHeight ? -descendantHeight : pos;
            api.start({
                to: { y: yy },
                immediate: true
            });
            updateSnap(yy);
        } else {
            const fy = (descendantHeight - posHeight) >= (descendantHeight * snapThreshold) ? -descendantHeight : 0,
                timeLapse = getFlingDuration(fy);

            api.start({
                to: { y: fy },
                config: { duration: timeLapse },
                immediate: false
            });
            updateSnap(fy, timeLapse);
        }
    };

    useEffect(() => {
        const el = handle ? document.querySelector(handle) : handleRef.current;
        const gesture = new DragGesture(el, p => dragListener.current(p));

        return () => {
            gesture.destroy();
        }
    }, [handle]);

    // useEffect(() => {

    // }, [isOpened]);

    useEffect(() => {
        if (mountedOpener.current) {
            setOpened(snap > -descendantHeight);

            if (snap === 0) {
                onOpened?.();
                setBlockScroll(true);
            } else if (snap === -descendantHeight) {
                onClosed?.();
                setBlockScroll(false);
            }
        }
        mountedOpener.current = true;
    }, [snap === -descendantHeight]);

    return (
        <div ref={ancestorRef}
            className={`collapsible-modal-ancestor${containerClass ? ' ' + containerClass : ''}`}
            style={{
                ...(fillParent ? {
                    position: 'absolute',
                    width: '100%',
                    height: '100%'
                } : undefined),
                ...(isOpened ? undefined : { zIndex: -99, visibility: 'hidden' }),
                ...containerStyle
            }}>
            <div
                onClick={() => {
                    if (!disableBackdropClose) refMethods.close();
                }}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    ...(renderBackdrop ? undefined : {
                        backgroundColor: backdropColor || 'rgba(0, 0, 0, 0.4)'
                    }),
                    ...(isOpened ? undefined : { backgroundColor: 'transparent' })
                }}>
                {isOpened ? (renderBackdrop?.() || null) : null}
            </div>

            <animated.div
                onClick={e => {
                    e.stopPropagation();
                }}
                ref={descendantRef}
                className={`collapsible-modal-descendant${contentClass ? ' ' + contentClass : ''}`}
                style={{ bottom: y }}>
                {
                    (handle || handleRefX) ? null :
                        <div
                            ref={handleRef}
                            style={{ touchAction: 'none' }}
                            className='collapsible-modal-handle'>
                        </div>
                }
                <div style={{ flex: 1, position: 'relative' }}>
                    {children}
                </div>
            </animated.div>
        </div>
    )
});

export default CollapsibleSheet;