import { useEffect, useRef, useState } from "react";

export default function ({ onSlideChange, onScrollChange, currentSlideIndex, behavior = 'smooth', children, style }) {
    const [sliderWidth, setSliderWidth] = useState();

    const sliderRef = useRef(),
        instantLastIndex = useRef(currentSlideIndex),
        scrollReducer = useRef();

    useEffect(() => {
        if (!isNaN(sliderWidth))
            sliderRef.current.scroll({ left: currentSlideIndex * sliderWidth, top: 0, behavior });
    }, [currentSlideIndex, sliderWidth]);

    return (
        <div
            ref={r => {
                sliderRef.current = r;
                if (!isNaN(r?.clientWidth)) setSliderWidth(r?.clientWidth);
            }}
            className="simple-slider-con"
            style={style}
            onScroll={e => {
                const { scrollLeft, clientWidth } = e.currentTarget;

                clearTimeout(scrollReducer.current);
                scrollReducer.current = setTimeout(() => {
                    const index = Math.round(scrollLeft / clientWidth);

                    if (instantLastIndex.current !== index && !isNaN(index)) {
                        onSlideChange?.(index);
                    }

                    instantLastIndex.current = index;
                }, behavior === 'smooth' ? 300 : 1);
                onScrollChange?.(e);
            }}>
            {children}
        </div>
    );
}