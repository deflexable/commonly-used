import { useEffect, useRef, useState } from "react";

export default function ({ leftArrowComponent, rightArrowComponent, children, scrollerClass, ...restProp }) {
    const [showPatch, setShowPatch] = useState(),
        [showRightArrow, setShowRightArrow] = useState(),
        [showLeftArrow, setShowLeftArrow] = useState(),
        [slideWidth, setSlideWidth] = useState(),
        [scrollWidth, setScrollWidth] = useState();

    const scrollOffset = useRef(),
        sliderRef = useRef();

    useEffect(() => {
        setShowPatch(slideWidth >= slideWidth);
    }, [slideWidth, scrollWidth]);

    useEffect(() => {
        const l = function () {
            const { clientWidth, scrollWidth, scrollLeft } = sliderRef.current;

            if (!isNaN(clientWidth)) setSlideWidth(clientWidth);
            if (!isNaN(scrollWidth)) setScrollWidth(scrollWidth);
            if (!isNaN(scrollLeft)) {
                scrollOffset.current = scrollLeft;
                setShowRightArrow(scrollWidth - (scrollLeft + clientWidth) >= 7);
                setShowLeftArrow(scrollLeft > 0);
            }
        }

        l();
        sliderRef.current.addEventListener('scroll', l);
        return () => {
            sliderRef.current?.removeEventListener?.('scroll', l);
        }
    }, []);

    return (
        <div {...restProp}>
            <div className="arrow-slider-con">
                <div className={`arrow-slider-scroller-con${scrollerClass ? ' ' + scrollerClass : ''}`}
                    ref={sliderRef}>
                    {children}
                </div>

                {showPatch && showLeftArrow && leftArrowComponent ?
                    <div className="arrow-slider-left-arrow-con arrow-slider-patch-con"
                        onClick={() => {
                            sliderRef.current.scroll({
                                left: Math.max(0, scrollOffset.current - scrollWidth),
                                behavior: 'smooth'
                            });
                        }}>
                        {leftArrowComponent}
                    </div>
                    : null}

                {showPatch && showRightArrow && rightArrowComponent ?
                    <div className="arrow-slider-right-arrow-con arrow-slider-patch-con"
                        onClick={() => {
                            sliderRef.current.scroll({
                                left: Math.min(scrollWidth, slideWidth + scrollOffset.current),
                                behavior: 'smooth'
                            });
                        }}>
                        {rightArrowComponent}
                    </div>
                    : null}
            </div>
        </div>
    );
}