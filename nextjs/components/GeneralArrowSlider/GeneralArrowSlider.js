"use client"

import ArrowSlider from "../ArrowSlider/ArrowSlider";
import "./GeneralArrowSlider.css";

export default function ({ children, disableArrow, arrowClass, scrollerClass, onPaginate, ...restProps }) {

    return (
        <ArrowSlider
            {...restProps}
            scrollerClass={`general-arrow-scroller${scrollerClass ? ' ' + scrollerClass : ''}`}
            leftArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-left ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: 'url(/assets/back.png)' }} />
                    </button>
                </div>
            )}
            rightArrowComponent={disableArrow ? null : (
                <div className={`general-arrow-right ${arrowClass || ''}`}>
                    <button>
                        <div style={{ backgroundImage: 'url(/assets/back.png)' }} />
                    </button>
                </div>
            )}>
            {children}
        </ArrowSlider>
    );
}