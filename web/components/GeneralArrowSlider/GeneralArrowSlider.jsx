import ArrowSlider from "../ArrowSlider/ArrowSlider";
import ArrowSrc from "~/assets/back.png";

export default function ({ children, disableArrow, arrowClass, scrollerClass, onPaginate, ...restProps }) {

    return (
        <ArrowSlider
            {...restProps}
            scrollerClass={`general-arrow-scroller${scrollerClass ? ' ' + scrollerClass : ''}`}
            leftArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-left ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: `url(${ArrowSrc})` }} />
                    </button>
                </div>
            )}
            rightArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-right ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: `url(${ArrowSrc})` }} />
                    </button>
                </div>
            )}>
            {children}
        </ArrowSlider>
    );
}