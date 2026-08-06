import { DbPath } from "core/common_values";
import { collection } from "./client_server";
import { AuthScope, WEB_STATE } from "./scope";
import { onUserThemeChanged } from "./theme_helper";
import { internal_keys, listeners } from "./listeners";
import { useSearchParams } from "next/navigation";
import { shouldBe } from "./methods.dual";
import { useEffect, useRef } from "react";

export const useUserConfig = () => {
    const search = useSearchParams();
    const theme = shouldBe(search.get('theme'), ['light', 'dark']);

    const realTheme = useRef();

    const trigger = () => {
        const o = WEB_STATE.prefferedSettingsValue;
        if (!o) return;
        WEB_STATE.prefferedSettingsValue = {
            ...o,
            theme: theme || realTheme.current
        };
        onUserThemeChanged(WEB_STATE.prefferedSettingsValue?.theme);
        listeners.dispatch(internal_keys.PREFFED_SETTINGS, {
            ...WEB_STATE.prefferedSettingsValue
        });
    }

    useEffect(trigger, [theme]);

    return () =>
        collection(DbPath.prefferedSettings).findOne({ _id: AuthScope.uid }).listen(l => {
            realTheme.current = l?.theme;
            WEB_STATE.prefferedSettingsValue = { ...l };
            trigger();
        });
}