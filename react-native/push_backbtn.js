import { useRef, useEffect } from "react";
import { BackHandler } from "react-native";

const BackActionScope = {
    list: [],
    iterator: 0
};

const attachCaller = (callback) => BackHandler.addEventListener('hardwareBackPress', () => {
    const result = callback?.();
    if (typeof result === 'boolean')
        return result;
    return true;
});

export const pushBackListener = (callback) => {
    if (BackActionScope.list.length) BackActionScope.list.slice(-1)[0].listener.remove();

    const thisIte = ++BackActionScope.iterator;
    BackActionScope.list.push({
        callback,
        listener: attachCaller(callback),
        ite: thisIte
    });
    let hasUnmount;

    return () => {
        if (hasUnmount) return;
        hasUnmount = true;
        const dex = BackActionScope.list.findIndex(v => v.ite === thisIte);
        const { listener } = BackActionScope.list[dex];
        const isTailCleanup = thisIte === BackActionScope.list.slice(-1)[0].ite;
        BackActionScope.list.splice(dex, 1);

        const newTail = BackActionScope.list.slice(-1)[0];

        if (newTail) {
            if (isTailCleanup) {
                listener.remove();
                newTail.listener = attachCaller(newTail.callback);
            }
        } else listener.remove();
    }
};

export const useBackButton = (callback, disabled) => {
    const thisCallback = useRef();
    thisCallback.current = callback;

    useEffect(() => {
        if (!disabled) return pushBackListener(() => thisCallback.current());
    }, [!disabled]);

    return callback;
}