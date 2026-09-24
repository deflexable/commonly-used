import { JSONCacher } from "@/src/utils/cacher";
import { DbPath } from "core/common_values";
import mserver, { collection } from "./client_server";
import listeners, { EVENT_NAMES } from "./listeners";
import { onUserThemeChanged } from "./theme_helper";

export const setPrefferSettings = (l) => {
    JSONCacher.USER_SETTINGS = { ...l };
    onUserThemeChanged(l?.theme);
    listeners.dispatch(EVENT_NAMES.userConfig, { ...l });
}

export const startListeningToUserSettings = () =>
    collection(DbPath.prefferedSettings)
        .findOne({ _id: mserver.user.uid })
        .listen(setPrefferSettings);