import { Scope } from "@this_app_root/src/utils/scope";
import { JSONCacher } from "@this_app_root/src/utils/cacher";
import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import listeners, { EVENT_NAMES } from "@this_app_root/src/utils/listeners";
import { onUserThemeChanged } from "./theme_helper";

export const setPrefferSettings = (l) => {
    Scope.prefferedSettingsValue = { ...l };
    JSONCacher.USER_SETTINGS = { ...l };
    onUserThemeChanged(l?.theme);
    listeners.dispatch(EVENT_NAMES.prefferedSettings, { ...l });
}

export const startListeningToUserSettings = () =>
    collection(DbPath.prefferedSettings).findOne({ _id: Scope.user.uid }).listen(setPrefferSettings);