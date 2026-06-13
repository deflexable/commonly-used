"use client"

import { internal_keys, listeners } from "../../listeners";
import { useBodyScrollBlocker } from "../../scroll_blocker";
import { useEffect, useRef, useState } from "react";
import DropModal from "../DropModal/DropModal";
import { ThemeHelperScope } from "../../scope";
import { toast } from "react-toastify";
import "./ContainerModals.css";

export const DropModalContainer = ({ yesLocale, noLocale }) => {
    const [fancyObj, setFancyObj] = useState();
    const [isFancyVisible, setFancyVisible] = useState(false);

    const fancyTimer = useRef();

    useEffect(() => {
        return listeners.listenTo(internal_keys.FANCY_DIALOG, (obj) => {
            clearTimeout(fancyTimer.current);
            setFancyVisible(!!obj);

            if (obj) {
                setFancyObj(obj);
            } else {
                fancyTimer.current = setTimeout(() => {
                    setFancyObj();
                }, 300);
            }
        }, false);
    }, []);

    return (
        <DropModal
            isOpen={!!isFancyVisible}
            dropType="bottom"
            onClickBackdrop={() => {
                if (!fancyObj?.disableBackdrop) {
                    closeFancyDialogX();
                    fancyObj?.onBackDropPressed?.();
                }
            }}>
            {fancyObj ?
                fancyObj.templateHtml ?
                    <div className='fancy-pop-up-con modal_bg_toggle'
                        style={fancyObj.templateStyle}>
                        {fancyObj.templateHtml?.()}
                    </div> :
                    <div className='fancy-pop-up-con modal_bg_toggle'>
                        {fancyObj.img ?
                            <div {...fancyObj.imgProps}
                                className={['fancy-pop-up-img', fancyObj.imgProps?.className].filter(v => v).join(' ')}
                                style={{ backgroundImage: `url(${fancyObj.img})`, ...fancyObj.imgStyle }} />
                            : fancyObj.headHtml ?
                                <div className='fancy-pop-up-head-html-con'
                                    style={fancyObj.headHtmlStyle}>
                                    {fancyObj.headHtml()}
                                </div> : null}

                        {fancyObj.title ? <h2 className='fancy-pop-up-title'>{fancyObj.title}</h2> : null}
                        <div className='fancy-pop-up-message clamp-text'>{fancyObj.message}</div>

                        <div className='fancy-pop-up-btn-con'>
                            {fancyObj.hideYes ? null :
                                <button
                                    disabled={fancyObj.disabledYes}
                                    onClick={() => {
                                        let prevent;
                                        fancyObj.onYes?.({ preventDefault: () => { prevent = true; } });
                                        if (!prevent) closeFancyDialogX();
                                    }}
                                    className={`fancy-pop-up-yes-btn${fancyObj.disabledYes ? '' : ' button-behaviour'}`}
                                    style={fancyObj.disabledYes ? { opacity: 0.5 } : undefined}>
                                    {fancyObj.yesTxt || yesLocale}
                                </button>}

                            {fancyObj.hideNo ? null :
                                <button onClick={() => { fancyObj.onNo ? fancyObj.onNo() : closeFancyDialogX(); }}
                                    className='fancy-pop-up-no-btn button-behaviour'>
                                    {fancyObj.noTxt || noLocale}
                                </button>}
                        </div>
                    </div> : null}
        </DropModal>
    );
}

export const usePageLoadingUI = () => {
    const [pageLoadingVisible, setPageLoadingVisible] = useState();
    const hasUnmounted = useRef();

    useEffect(() => {
        const l = listeners.listenTo(internal_keys.PAGE_LOADING_TRANSITION, (m) => {
            setPageLoadingVisible(!!m);
        });

        return () => {
            hasUnmounted.current = true;
            l();
            listeners.dispatch(internal_keys.PAGE_LOADING_TRANSITION);
        }
    }, []);

    return {
        showPageLoading: (message) => {
            if (!hasUnmounted.current)
                listeners.dispatch(internal_keys.PAGE_LOADING_TRANSITION, message);
        },
        closePageLoading: () => {
            if (!hasUnmounted.current)
                listeners.dispatch(internal_keys.PAGE_LOADING_TRANSITION);
        },
        pageLoadingVisible
    }
}

export const useFancyDialog = () => {
    const [isOpened, setOpened] = useState();
    const hasUnmounted = useRef();

    useEffect(() => {
        const fancyListener = listeners.listenTo(internal_keys.FANCY_DIALOG, obj => {
            setOpened(!!obj);
        }, false);

        return () => {
            hasUnmounted.current = true;
            fancyListener();
            closeFancyDialogX();
        }
    }, []);

    return {
        isFancyDialogOpened: isOpened,
        openFancyDialog: function () {
            if (!hasUnmounted.current)
                openFancyDialogX(...[...arguments]);
        },
        closeFancyDialog: () => {
            if (!hasUnmounted.current) closeFancyDialogX();
        }
    }
}

export const shareLink = (link, title) => {
    listeners.dispatch(internal_keys.SHARE_DIALOG, { link, title });
}

export const showFancyToast = (message, option = { type: undefined }) => {
    const {
        theme = ThemeHelperScope.isDarkMode ? 'dark' : 'light',
        className = 'normal-toast-content-bg',
        type
    } = option;

    toast(message, {
        position: "top-right",
        autoClose: 7000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        type,
        // progressStyle: { backgroundColor: 'var(--theme-color)' },
        className,
        theme
    });
}

const openFancyDialogX = ({
    onYes,
    onNo,
    yesTxt,
    noTxt,
    title,
    message,
    img,
    imgStyle,
    imgProps,
    disableBackdrop,
    hideYes,
    hideNo,
    disabledYes,
    headHtml,
    headHtmlStyle,
    onBackDropPressed,
    templateHtml,
    templateStyle
}) => {
    listeners.dispatch(internal_keys.FANCY_DIALOG, { onYes, onNo, yesTxt, noTxt, title, message, img, imgProps, disableBackdrop, hideYes, hideNo, headHtml, headHtmlStyle, onBackDropPressed, imgStyle, templateHtml, templateStyle, disabledYes });
};

const closeFancyDialogX = () => {
    listeners.dispatch(internal_keys.FANCY_DIALOG);
};

export const LoadingModalContainer = () => {
    const [loadingTrans, setLoadingTrans] = useState();

    useBodyScrollBlocker(!!loadingTrans);

    useEffect(() => {
        return listeners.listenTo(internal_keys.PAGE_LOADING_TRANSITION, obj => {
            setLoadingTrans(obj);
        }, false);
    }, []);

    if (!loadingTrans) return null;

    return (
        <div className='page-loading-trans-con'
            onClick={e => {
                e.stopPropagation();
            }}>
            <div className='plainBG' />
            <div className='page-loading-trans-cont'>
                <div className="invertion" />
                {typeof loadingTrans === 'string' ? <span>{loadingTrans}</span> : null}
            </div>
        </div>
    );
}