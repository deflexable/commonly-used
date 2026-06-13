import { DbPath, SUPPORTED_LANGUAGES } from "core/common_values.js";
import { AuthScope } from "./scope";
import { collection } from "./client_server";
import { updateCookie } from "./methods.client";
import { simplifyCaughtError } from "simplify-error";

export const updateLanguage = async (value) => {
    const url = new URL(location.href),
        urlLang = url.pathname.split('/')[1],
        isAuto = !value || value === 'auto';

    if (urlLang && SUPPORTED_LANGUAGES[urlLang]) {
        if (urlLang === value) return;
        url.pathname = url.pathname.split('/').map(((v, i) => i === 1 ? value : v)).join('/');
        location.href = url.href;
        return;
    } else if (AuthScope.uid) {
        await collection(DbPath.prefferedSettings).mergeOne({ _id: AuthScope.uid }, {
            [isAuto ? '$unset' : '$set']: { locale: isAuto || value }
        }, { delivery: 'no-cache-no-await' }).catch(e => {
            const { error, message } = simplifyCaughtError(e).simpleError;
            alert(`${error || 'Error'}: ${message}`);
        });
    } else {
        await updateCookie('lang', isAuto ? null : value);
    }
    location.reload();
}