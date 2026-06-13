import { Platform } from "react-native";
import { JSONCacher } from "@this_app_root/src/utils/cacher";
import appleAuth, { appleAuthAndroid } from "@invertase/react-native-apple-authentication";
import { Buffer } from "buffer";

export const AppleSigninCancelledSignal = Symbol('cancelled_error');

export const getAppleUser = async () => {
    let token, name;

    if (Platform.OS === 'android') {
        const res = await appleAuthAndroid.signIn();
        const nameObj = res.user?.name;
        console.log('id_token:', res);

        token = res.id_token;
        if (nameObj?.firstName || nameObj?.lastName)
            name = `${nameObj.firstName} ${nameObj.lastName}`.trim();
    } else {
        const res = await appleAuth.performRequest({
            requestedOperation: appleAuth.Operation.LOGIN,
            requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
            nonceEnabled: false
        });
        const nameObj = res.fullName;
        console.log('applesRes:', res);

        token = res.identityToken;
        if (nameObj?.givenName || nameObj?.familyName)
            name = `${nameObj.givenName} ${nameObj.familyName}`.trim();
    }

    const { email } = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    const preObj = JSONCacher.APPLE_PERSISTED_USER || {};

    if (name) {
        preObj[email] = name;
        JSONCacher.APPLE_PERSISTED_USER = preObj;
    } else name = preObj[email];

    return { token, name };
}