import { Linking, Platform } from "react-native";
import InAppReview from 'react-native-in-app-review';
import { TIMESTAMP } from "react-native-mosquito-transport";
import { APPSTORE_REVIEW_URL, DbPath, PLAYSTORE_REVIEW_URL } from "core/common_values";
import { locales } from "@this_app_root/src/locale";
import { showFancyDialog } from "./components/FancyPopup";
import { RateAppImg } from "@this_app_root/src/utils/assets";
import { Scope } from '@this_app_root/src/utils/scope';
import { collection } from './client_server';
import { JSONCacher } from '@this_app_root/src/utils/cacher';
import { getBusy } from "./uptime";

JSONCacher.RATED_APP;
JSONCacher.RATED_IN_APP;

let hasRequested;

export async function requestReview({ withUser, withBusy }) {
    if (Scope.prefferedSettingsValue?.has_rated || isNaN(withBusy) || (withUser && !Scope.user?.authVerified)) return;
    if ((await getBusy(withUser)).time < withBusy) return;
    if (hasRequested) return;
    hasRequested = true;

    const dialogRating = JSONCacher.RATED_APP;
    if (dialogRating === true || (!isNaN(dialogRating) && dialogRating >= 3)) return;

    const inAppRating = JSONCacher.RATED_IN_APP;
    if (inAppRating === true || (!isNaN(inAppRating) && inAppRating >= 15)) return;

    try {
        console.log('try opening in-app rating');
        if (InAppReview.isAvailable()) {
            JSONCacher.RATED_IN_APP = (JSONCacher.RATED_IN_APP || 0) + 1;

            if (!(await InAppReview.RequestInAppReview())) throw 'cant presented';
        } else throw 'in app rating not supported';
    } catch (error) {
        console.error('requestReview err:', error);
        setTimeout(() => {
            JSONCacher.RATED_APP = (JSONCacher.RATED_APP || 0) + 1;
            showFancyDialog({
                title: locales.rate_this_app,
                des: locales.rate_app_des,
                flexer: true,
                img: RateAppImg,
                lockModal: true,
                onYes: () => {
                    Linking.openURL(Platform.OS === 'android' ? PLAYSTORE_REVIEW_URL : APPSTORE_REVIEW_URL);
                    JSONCacher.RATED_APP = true;
                    if (Scope.user)
                        collection(DbPath.prefferedSettings).mergeOne({ _id: Scope.user.uid }, {
                            $set: { has_rated: TIMESTAMP }
                        });
                },
                yesTxt: locales.rate_now,
                noTxt: locales.dismiss
            });
        }, 1300);
    }
};