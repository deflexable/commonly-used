import { useEffect, useRef, useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import AppModal from "./AppModal";
import { Colors } from "@this_app_root/src/utils/values";
import { locales } from "@this_app_root/src/locale";
import listeners, { EVENT_NAMES } from "@this_app_root/src/utils/listeners";
import TextView from "./TextView";

export default function () {
    const [list, setList] = useState([]);

    const incomingRemove = useRef({});

    useEffect(() => {
        return listeners.listenTo(EVENT_NAMES.dialogContext, s => {
            if (s instanceof DialogCloseSignal) {
                incomingRemove.current[s.value] = true;
                setList(prev => [...prev]);
            } else {
                setList(prev => {
                    const dex = prev.findIndex(v => v.id === s.id);

                    if (dex === -1) return [...prev, s];
                    prev[dex] = s;
                    return [...prev];
                });
            }
        });
    }, []);

    return list.map(v =>
        <FancyDialog
            key={v.id}
            data={v}
            shouldClose={incomingRemove.current[v.id]}
            onRemove={() => {
                setList(prev => prev.filter(k => k.id !== v.id));
                if (incomingRemove.current[v.id])
                    delete incomingRemove.current[v.id];
            }} />
    );
}

function FancyDialog({ data, shouldClose, onRemove }) {
    const {
        title,
        des,
        onYes,
        onNo,
        yesTxt,
        noTxt,
        hideYes,
        hideNo,
        img,
        flexer,
        topComponent,
        onDismiss
    } = data || {};
    const dialogRef = useRef();

    useEffect(() => {
        dialogRef.current.open();
    }, []);

    useEffect(() => {
        if (shouldClose) dialogRef.current?.close?.();
    }, [!shouldClose]);

    return (
        <AppModal
            ref={dialogRef}
            centered
            disabled={data?.lockModal}
            modalName={'fancyPopup'}
            unMountChildrenWhenClosed={false}
            fillScreen={false}
            style={styling.cont}
            onClosed={() => {
                onRemove();
                onDismiss?.();
            }}>
            {topComponent ? topComponent() :
                <Image
                    source={img}
                    style={styling.topImg} />}
            <TextView style={styling.title}>
                {title}
            </TextView>
            <TextView
                numberOfLines={4}
                style={styling.des}>
                {des}
            </TextView>

            <View style={flexer ? styling.bottomBtnConFlexer : styling.bottomBtnCon}>
                {hideYes ? null
                    : <TouchableOpacity
                        style={flexer ? styling.btnPositiveConFlexed : styling.btnPositiveCon}
                        onPress={() => {
                            let preventDefault;

                            onYes({
                                preventDefault: () => {
                                    preventDefault = true;
                                }
                            });
                            if (!preventDefault) hideFancyDialog(data.id);
                        }}>
                        <TextView
                            numberOfLines={1}
                            invertColor
                            forceSize={flexer ? 14 : undefined}
                            style={styling.btnTxt}>
                            {yesTxt || locales.yes}
                        </TextView>
                    </TouchableOpacity>}

                {hideNo ? null :
                    <TouchableOpacity
                        style={flexer ? styling.btnNegativeConFlexed : styling.btnNegativeCon}
                        onPress={() => {
                            let preventDefault;

                            onNo?.({
                                preventDefault: () => {
                                    preventDefault = true;
                                }
                            });
                            if (!preventDefault) hideFancyDialog(data.id);
                        }}>
                        <TextView
                            numberOfLines={1}
                            forceColor={Colors.themeColor}
                            style={styling.btnTxt}>
                            {noTxt || locales.no}
                        </TextView>
                    </TouchableOpacity>}
            </View>
        </AppModal>
    );
};

class DialogCloseSignal {
    constructor(value) {
        this.value = value;
    }
}

export const hideFancyDialog = (id) => {
    listeners.dispatch(EVENT_NAMES.dialogContext, new DialogCloseSignal(id));
}

const styling = {
    cont: {
        width: '80%',
        maxWidth: 350,
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        alignSelf: 'center',
        shadowOffset: { width: 3, height: 3 },
        shadowColor: Colors.gray,
        shadowOpacity: .5,
        elevation: 7
    },

    topImg: {
        width: '40%',
        maxWidth: 100,
        maxHeight: 100,
        aspectRatio: 1
    },

    title: {
        fontWeight: 'bold',
        fontSize: 21,
        textAlign: 'center',
        marginTop: 15,
        marginHorizontal: 10
    },

    des: {
        textAlign: 'center',
        marginTop: 7,
        marginHorizontal: 10
    },

    bottomBtnCon: {
        width: '100%'
    },

    bottomBtnConFlexer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center'
    },

    btnPositiveCon: {
        backgroundColor: Colors.themeColor,
        padding: 12,
        marginTop: 30,
        borderRadius: 7
    },

    btnPositiveConFlexed: {
        flex: 1,
        backgroundColor: Colors.themeColor,
        padding: 9,
        marginTop: 30,
        borderRadius: 7,
        marginRight: 7
    },

    btnTxt: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold'
    },

    btnNegativeCon: {
        borderColor: Colors.themeColor,
        padding: 11,
        marginTop: 30,
        borderRadius: 7,
        borderWidth: 1
    },

    btnNegativeConFlexed: {
        flex: 1,
        borderColor: Colors.themeColor,
        padding: 8,
        marginTop: 30,
        borderRadius: 7,
        marginLeft: 7,
        borderWidth: 1
    }
};

export const useFancyDialog = () => {
    const hasUnmounted = useRef();
    const currentId = useRef([]);

    const obj = {
        openFancyDialog: (o) => {
            if (hasUnmounted.current) return;
            const thisId = showFancyDialog(o);
            currentId.current.push(thisId);
            return thisId;
        },
        hideFancyDialog: (id) => {
            if (hasUnmounted.current) return;
            if (id === undefined) {
                if (currentId.current.length)
                    currentId.current.forEach(e => {
                        hideFancyDialog(e);
                    });
                currentId.current = [];
            } else {
                hideFancyDialog(id)
            }
        }
    }

    useEffect(() => {
        return () => {
            obj.hideFancyDialog();
            hasUnmounted.current = true;
        }
    }, []);

    return obj;
};

let dialogIdIterator = 0;

export const showFancyDialog = ({
    img,
    topComponent,
    title,
    message,
    des,
    onYes,
    yesTxt,
    noTxt,
    onNo,
    hideYes,
    hideNo,
    flexer,
    lockModal,
    onDismiss,
    id
}) => {
    const identifier = id || ++dialogIdIterator;

    listeners.dispatch(
        EVENT_NAMES.dialogContext,
        {
            id: identifier,
            title,
            des: des || message,
            onYes,
            yesTxt,
            noTxt,
            onNo,
            hideNo,
            hideYes,
            img,
            topComponent,
            flexer,
            lockModal,
            onDismiss
        }
    );
    return identifier;
}

export const usePageLoadingUI = () => {
    const [isLoaderVisible, setLoaderVisible] = useState();
    const hasUnmounted = useRef();

    useEffect(() => {
        const l = listeners.listenTo(EVENT_NAMES.pageTransMessageModalListener, s => {
            setLoaderVisible(!!s);
        });

        return () => {
            listeners.dispatch(EVENT_NAMES.pageTransMessageModalListener);
            l();
            hasUnmounted.current = true;
        }
    }, []);

    return {
        isLoaderVisible,
        showLoader: (message) => {
            if (hasUnmounted.current) return;
            listeners.dispatch(EVENT_NAMES.pageTransMessageModalListener, { message });
        },
        hideLoader: () => {
            if (hasUnmounted.current) return;
            listeners.dispatch(EVENT_NAMES.pageTransMessageModalListener);
        }
    }
};