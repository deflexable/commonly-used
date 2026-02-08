import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import { ListenersKey } from "website/app/utils/listeners.js";
import { CentralizeListener } from "./listeners";
import { AuthScope } from "./scope";
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