import { DbPath } from "core/common_values";
import { collection } from "bbx-commonly-used/web/client_server";
import { ListenersKey } from "website/app/utils/listeners.js";
import { CentralizeListener } from "bbx-commonly-used/web/listeners";
import { AuthScope } from "bbx-commonly-used/web/scope";
import { onUserThemeChanged } from "bbx-commonly-used/web/theme_helper";

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