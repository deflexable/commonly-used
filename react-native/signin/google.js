import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { simplifyError } from "simplify-error";

export const GoogleSigninCancelledSignal = Symbol('cancelled_error');

export const getGoogleUser = async () => {
    try {
        if (!(await GoogleSignin.hasPlayServices()))
            throw { code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE };

        const userInfo = await GoogleSignin.signIn();
        return userInfo;
    } catch (error) {
        if (error.code === statusCodes.IN_PROGRESS) {
            throw simplifyError('error', 'google_sign_in_in_progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw simplifyError('error', 'google_sign_in_play_services');
        } else if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw GoogleSigninCancelledSignal;
        } else {
            throw simplifyError('error', `${error}`);
        }
    }
}