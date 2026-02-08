import { useEffect, useRef, useState } from "react";
import CollapsibleSheet from "../CollapsibleModal/CollapsibleSheet";
import DropModal from "../DropModal/DropModal";
import ModalHandle from "../ModalHandle/ModalHandle";
import { CentralizeListener } from "../../listeners";

export const PREVENT_OPEN_SIGNAL = Symbol();

export default function ({
    listenerKey,
    onListened,
    children,
    pcModalClass,
    phoneModalClass,
    renderHeader,
    phoneScrollerClass,
    pcScrollerClass,
    pcStyle,
    pcContainerStyle,
    phoneStyle,
    showPhoneHandle,
    onCloseModal
}) {
    const [isModalVisible, setModalVisible] = useState(false);

    const dynamicPhoneModalRef = useRef(),
        wasPc = useRef(),
        lastVisibleListener = useRef(),
        handlerRef = useRef(),
        instantListener = useRef();

    instantListener.current = onListened;

    useEffect(() => {
        const l = new ResizeObserver(() => {
            const isPc = document.body.clientWidth >= 800,
                b4Pc = wasPc.current;
            wasPc.current = isPc;

            if (b4Pc && !isPc) {
                setModalVisible(false);
                if (lastVisibleListener.current) dynamicPhoneModalRef.current.open();
            }
            if (!b4Pc && isPc) {
                if (lastVisibleListener.current) setModalVisible(true);
                dynamicPhoneModalRef.current.close();
            }
        });
        l.observe(document.getElementsByTagName('body').item(0));

        const dialogLister = CentralizeListener.listenTo(listenerKey, (obj) => {
            const { open = true, args } = obj || {};

            if (instantListener.current?.(...(args || [])) === PREVENT_OPEN_SIGNAL) return;

            if (open) {
                if (wasPc.current) {
                    setModalVisible(true);
                } else dynamicPhoneModalRef.current.open();
                lastVisibleListener.current = true;
            } else {
                setModalVisible(false);
                dynamicPhoneModalRef.current.close();
                lastVisibleListener.current = false;
            }
        }, false);

        return () => {
            l.disconnect();
            dialogLister();
        }
    }, []);

    const getChildElement = (isPhone) => typeof children === 'function' ? children?.({ isPhone, isCurrentPhone: !wasPc.current }) : children;

    return (
        <>
            <DropModal
                isOpen={!!isModalVisible}
                dropType="bottom"
                containerStyle={(isModalVisible && pcContainerStyle) ? pcContainerStyle : undefined}
                onClickBackdrop={() => {
                    setModalVisible(false);
                    if (wasPc.current) lastVisibleListener.current = false;
                    onCloseModal?.();
                }}>
                {
                    renderHeader ?
                        <div className={`dynamic-pc-modal-con modal_bg_toggle no-scrollbars${pcModalClass ? ' ' + pcModalClass : ''}`}
                            style={{ display: 'flex', flexDirection: 'column', height: '85vh', ...pcStyle }}>
                            <div className="dynamic-pc-modal-header-con">
                                {renderHeader?.()}
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <div className={`dynamic-pc-modal-scroller-con ${pcScrollerClass || ''}`.trim()}>
                                    {getChildElement()}
                                </div>
                            </div>
                        </div> :
                        <div className={`dynamic-pc-modal-con modal_bg_toggle no-scrollbars ${pcModalClass || ''} ${pcScrollerClass || ''}`.trim()}
                            style={pcStyle}>
                            {getChildElement()}
                        </div>
                }
            </DropModal>

            <CollapsibleSheet
                ref={dynamicPhoneModalRef}
                onClosed={() => {
                    if (!wasPc.current) {
                        lastVisibleListener.current = false;
                        onCloseModal?.();
                    }
                }}
                handleRef={handlerRef}>
                {
                    renderHeader ?
                        <div className={`dynamic-phone-modal-packer modal_bg_toggle${phoneModalClass ? ' ' + phoneModalClass : ''}`}
                            style={{ display: 'flex', flexDirection: 'column', height: '85vh', ...phoneStyle }}>
                            <div ref={handlerRef}
                                style={{ touchAction: 'none' }}>
                                <ModalHandle />
                                {renderHeader?.() || null}
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <div className={`dynamic-phone-scroller ${phoneScrollerClass || ''}`.trim()}>
                                    {getChildElement(true)}
                                </div>
                            </div>
                        </div> :
                        <div className={`dynamic-phone-modal-packer modal_bg_toggle ${phoneModalClass || ''} ${phoneScrollerClass || ''}`.trim()}
                            style={phoneStyle}>
                            <div ref={handlerRef}
                                style={{ touchAction: 'none' }}>
                                {showPhoneHandle ? <ModalHandle /> : null}
                            </div>
                            {getChildElement(true)}
                        </div>
                }
            </CollapsibleSheet>
        </>
    );
}