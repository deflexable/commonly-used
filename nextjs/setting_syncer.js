import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import { AuthScope, WEB_STATE } from "./scope";
import { onUserThemeChanged } from "./theme_helper";
import { internal_keys, listeners } from "./listeners";

export const listenUserConfig = () => {
    return collection(DbPath.prefferedSettings).findOne({ _id: AuthScope.uid }).listen(l => {
        WEB_STATE.prefferedSettingsValue = { ...l };
        onUserThemeChanged(l?.theme);
        listeners.dispatch(internal_keys.PREFFED_SETTINGS, { ...l });
    });
}