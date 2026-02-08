import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import { CentralizeListener, ListenersKey } from "website/app/utils/listeners.js";
import { AuthScope } from "website/app/utils/scope";
import { onUserThemeChanged } from "./theme_helper";

const settingsMapper = {
    theme: onUserThemeChanged
}

export const startListeningToUserSettings = () => {
    return collection(DbPath.prefferedSettings).findOne({ _id: AuthScope.uid }).listen(l => {
        Object.entries(settingsMapper).forEach(([k, func]) => {
            func(l?.[k]);
        });
        CentralizeListener.dispatch(ListenersKey.PREFFED_SETTINGS, l || null);
    });
}