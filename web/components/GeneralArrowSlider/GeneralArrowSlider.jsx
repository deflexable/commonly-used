import ArrowSlider from "../ArrowSlider/ArrowSlider";

export default function ({ children, disableArrow, arrowClass, scrollerClass, onPaginate, arrowSrc, ...restProps }) {

    return (
        <ArrowSlider
            {...restProps}
            scrollerClass={`general-arrow-scroller${scrollerClass ? ' ' + scrollerClass : ''}`}
            leftArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-left ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: `url(${arrowSrc})` }} />
                    </button>
                </div>
            )}
            rightArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-right ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: `url(${arrowSrc})` }} />
                    </button>
                </div>
            )}>
            {children}
        </ArrowSlider>
    );
}