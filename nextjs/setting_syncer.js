import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import { AuthScope, WEB_STATE } from "./scope";
import { onUserThemeChanged } from "./theme_helper";
import { internal_keys, listeners } from "./listeners";
import { useSearchParams } from "next/navigation";
import { shouldBe } from "./methods.dual";
import { useEffect } from "react";

const DefaultTheme = shouldBe(process.env.NEXT_PUBLIC_DEFAULT_THEME, ['light', 'dark']);

export const useUserConfig = () => {
    const search = useSearchParams();
    const theme = shouldBe(search.get('theme'), ['light', 'dark']);

    const trigger = () => {
        onUserThemeChanged(theme || WEB_STATE.prefferedSettingsValue?.theme || DefaultTheme);
    }

    useEffect(trigger, [theme]);

    return () =>
        collection(DbPath.prefferedSettings)
            .findOne({ _id: AuthScope.uid })
            .listen(l => {
                WEB_STATE.prefferedSettingsValue = { ...l };
                trigger();
                listeners.dispatch(internal_keys.PREFFED_SETTINGS, { ...l });
            });
}