import { useEffect, useRef, useState } from "react";
import { useBodyScrollBlocker } from "../../methods";

export default function ({ children, isOpen, onClickBackdrop, dropType = 'bottom', containerClass, containerStyle, durationMs = 300, disableOverflowToggle }) {

    const [height, setHeight] = useState();
    const [width, setWidth] = useState();
    const [innerOpen, setInnerOpen] = useState(false);

    const isVerticalDrop = dropType === 'bottom' || dropType === 'top',
        dropSize = (isVerticalDrop ? height : width);

    const timerRef = useRef();

    if (!disableOverflowToggle)
        useBodyScrollBlocker(isOpen);

    useEffect(() => {
        if (isNaN(durationMs)) {
            setInnerOpen(isOpen);
        } else {
            clearTimeout(timerRef.current);
            if (isOpen) {
                setInnerOpen(true);
            } else {
                timerRef.current = setTimeout(() => {
                    setInnerOpen(false);
                }, durationMs);
            }
        }
    }, [!!isOpen]);

    return (
        <div className={`drop-modal-con${innerOpen ? '' : ' drop-modal-con-closed'}${containerClass ? ' ' + containerClass : ''}`}
            onClick={onClickBackdrop}
            style={{
                zIndex: innerOpen ? 999 : -999,
                ...containerStyle
            }}>
            <div className="drop-modal-content-dropper"
                style={{
                    transition: `${dropType} ${durationMs}ms, opacity ${durationMs}ms`,
                    ...(
                        (typeof height === 'number' && typeof width === 'number') ?
                            {
                                [dropType]: isOpen ? `calc(50% - ${dropSize / 2}px)` : `${-dropSize}px`,
                                opacity: isOpen ? '1' : '0'
                            } :
                            { visibility: 'hidden' }
                    )
                }}
                onClick={e => {
                    e.stopPropagation();
                }}
                ref={r => {
                    if (!isNaN(r?.clientHeight) && !isNaN(r?.clientWidth)) {
                        setHeight(r.clientHeight);
                        setWidth(r.clientWidth);
                    }
                }}>
                {children}
            </div>
        </div>
    );
}