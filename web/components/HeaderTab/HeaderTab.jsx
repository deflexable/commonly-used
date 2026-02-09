import { useEffect, useRef, useState } from "react";
import SimpleSlider from "bbx-commonly-used/web/components/SimpleSlider/SimpleSlider";
import GeneralArrowSlider from "bbx-commonly-used/web/components/GeneralArrowSlider/GeneralArrowSlider";

export default function ({ Tabs = [], renderTabSlide, children, onTabChanged, slideContainerProps, tabbarClass }) {
    const [currentTab, setCurrentTab] = useState(0),
        [tabIndicatorOffset, setTabIndicatorOffset] = useState(0),
        [topTempHeight, setTopTempHeight] = useState(),
        [__, refreshState] = useState();

    const slideScrollOffsetMap = useRef(Array(Tabs.length).fill(0)),
        headerTabConRef = useRef(),
        slideLoadData = useRef(Array(Tabs.length).fill(0));

    useEffect(() => {
        const scrollOff = slideScrollOffsetMap.current[currentTab];

        window.scrollTo({
            top: Math.max(topTempHeight, scrollOff)
        });

        let n = 0;
        slideLoadData.current.forEach((e, i) => {
            if (currentTab > i) n += e;
        });
        setTabIndicatorOffset(n);
    }, [currentTab]);

    useEffect(() => {
        const l = new ResizeObserver(r => {
            const h = r?.[0]?.contentRect?.height;
            if (h) setTopTempHeight(h);
        });
        l.observe(headerTabConRef.current);

        return () => {
            l.disconnect();
        }
    }, []);

    const onTabSlideChanged = (i) => {
        if (i === currentTab) return;
        slideScrollOffsetMap.current[currentTab] = window.scrollY;
        setCurrentTab(i);
        onTabChanged?.(i);
    }

    return (
        <div>
            <div ref={headerTabConRef}>
                {children}
            </div>

            <div {...slideContainerProps}>
                <div className={tabbarClass || "top-sticky"}>
                    <GeneralArrowSlider
                        arrowClass="profile-tabbar-arrow-slide">
                        {Tabs.map((v, i) =>
                            <button key={v}
                                className="profile-tabbar-btn button-behaviour"
                                style={i === currentTab ? {} : { opacity: 0.5 }}
                                onClick={() => { onTabSlideChanged(i) }}
                                ref={r => {
                                    if (r?.clientWidth) {
                                        const shouldUpdate = slideLoadData.current[i] !== r.clientWidth;
                                        slideLoadData.current[i] = r.clientWidth;

                                        if (shouldUpdate) refreshState({});
                                    }
                                }}>
                                {v}
                            </button>
                        )}
                    </GeneralArrowSlider>
                    <div className="profile-tabbar-indicator-con no-scrollbars"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            bottom: '-2px',
                            display: 'flex',
                            overflowX: 'auto'
                        }}>
                        <div style={{
                            width: tabIndicatorOffset
                        }} />
                        <span style={{
                            width: slideLoadData.current[currentTab]
                        }} />
                    </div>
                </div>
                <SimpleSlider
                    onSlideChange={i => { onTabSlideChanged(i) }}
                    currentSlideIndex={currentTab}>
                    {Tabs.map((v, i, a) =>
                        <div style={currentTab === i ? undefined : {
                            overflow: 'hidden',
                            height: '70vh'
                        }}
                            key={`${i}${v}`}>
                            {renderTabSlide?.(v, i, a)}
                        </div>
                    )}
                </SimpleSlider>
            </div>
        </div>
    );
}