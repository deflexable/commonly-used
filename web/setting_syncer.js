import { DbPath } from "core/common_values";
import { collection } from "bbx-commonly-used/web/client_server";
import { ListenersKey } from "website/app/utils/listeners";
import { CentralizeListener } from "bbx-commonly-used/web/listeners";
import { AuthScope } from "bbx-commonly-used/web/scope";
import { onUserThemeChanged } from "bbx-commonly-used/web/theme_helper";
import { WEB_STATE } from 'bbx-commonly-used/web/scope';

export const startListeningToUserSettings = () => {
    return collection(DbPath.prefferedSettings).findOne({ _id: AuthScope.uid }).listen(l => {
        onUserThemeChanged(l?.theme);
        WEB_STATE.prefferedSettingsValue = { ...l };
        CentralizeListener.dispatch(ListenersKey.PREFFED_SETTINGS, { ...l });
    });
}