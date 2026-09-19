import { Settings, Platform } from "react-native";
import { default as bbx_rn_lib } from "./NativeBbxCommonlyUsed.js";
export default bbx_rn_lib;

const mcode = bbx_rn_lib.getUniqueId();

export const getMachineCode = async () => {
    return mcode;
}

export const getLocale = async () => {
    if (Platform.OS === 'ios') {
        return Settings.get('AppleLanguages')?.[0] || Settings.get('AppleLocale');
    } else {
        return bbx_rn_lib.getCurrentLocale();
    }
}

export const listenLocale = (callback) => {
    if (Platform.OS === 'ios') {
        const n = Settings.watchKeys('AppleLanguages', async () => {
            callback(await getLocale());
        });

        return () => {
            Settings.clearWatch(n);
        }
    }

    const sub = bbx_rn_lib.onLocaleChanged(callback);
    return () => {
        sub.remove();
    }
}