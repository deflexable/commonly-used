import { Linking, Platform } from "react-native";
import InAppReview from 'react-native-in-app-review';
import { hasGms, hasHms } from 'react-native-device-info';
import { TIMESTAMP } from "react-native-mosquito-transport";
import { APPSTORE_REVIEW_URL, DbPath, PLAYSTORE_REVIEW_URL } from "core/common_values";
import { locales } from "@this_app_root/src/locale";
import { showFancyDialog } from "./components/FancyPopup";
import { RateAppImg } from "@this_app_root/src/utils/assets";
import { Scope } from '@this_app_root/src/utils/scope';
import { collection } from './client_server';
import { JSONCacher } from '@this_app_root/src/utils/cacher';

export const softRequestReview = () => {
    if (JSONCacher.APP_OPEN_COUNTER >= 3 && Scope.IS_ONLINE) requestReview();
};

let hasRequested;

export async function requestReview() {
    if (Scope.prefferedSettingsValue?.has_rated || !Scope.user || JSONCacher.RATED_APP || hasRequested) return;
    hasRequested = true;

    const flagDoReview = (props) => {
        JSONCacher.RATED_APP = true;
        collection(DbPath.prefferedSettings).mergeOne({ _id: Scope.user.uid }, {
            $set: { has_rated: TIMESTAMP, ...props }
        });
    };

    try {
        let props;
        const now = Date.now();

        if (Platform.OS !== 'android' || await hasGms()) {
            if (!(await InAppReview.RequestInAppReview())) throw 'cant presented';
            props = { in_app_rated: true };
        } else if (false && await hasHms()) {
            await InAppReview.requestInAppCommentAppGallery().then(code => {
                if (!['102', '103'].includes(`${code}`)) throw 'cant present';
                props = { rated_huawei: true };
            });
        } else throw 'no gms found';
        if (Platform.OS === 'android' && Date.now() - now < 1500) throw 'too quick';

        flagDoReview(props);
    } catch (error) {
        console.error('requestReview err:', error);
        showFancyDialog({
            title: locales.rate_this_app,
            des: locales.rate_app_des,
            flexer: true,
            img: RateAppImg,
            lockModal: true,
            onYes: () => {
                Linking.openURL(Platform.OS === 'android' ? PLAYSTORE_REVIEW_URL : APPSTORE_REVIEW_URL);
                flagDoReview();
            },
            yesTxt: locales.rate_now,
            noTxt: locales.dismiss
        });
    }
};