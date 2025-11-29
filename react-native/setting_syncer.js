import { Scope } from "@this_app_root/src/utils/scope";
import { onUserThemeChanged } from "./theme_helper";
import { STORAGE_KEYS } from "@this_app_root/src/utils/cacher";
import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import listeners, { EVENT_NAMES } from "@this_app_root/src/utils/listeners";
import { serializeStorage } from "./cacher.js";

listeners.listenTo(EVENT_NAMES.prefferedSettings, s => {
    onUserThemeChanged(s?.theme);
});

export const setPrefferSettings = (l) => {
    Scope.prefferedSettingsValue = { ...l };
    listeners.dispatch(EVENT_NAMES.prefferedSettings, { ...l });
    serializeStorage(STORAGE_KEYS.PREFFERED_SETTINGS, JSON.stringify({ ...l }));
}

export const startListeningToUserSettings = () =>
    collection(DbPath.prefferedSettings).findOne({ _id: Scope.user.uid }).listen(setPrefferSettings);