import { GoogleSignIn } from "@thoughtbot/react-native-social-auth/src/google/GoogleSignIn";
import { GoogleSignInErrorCode } from "@thoughtbot/react-native-social-auth/src/google/errors";
import { simplifyError } from "simplify-error";

export const GoogleSigninCancelledSignal = Symbol('cancelled_error');

/**
 * @type {import('@thoughtbot/react-native-social-auth')['GoogleSignIn']['signIn']}
 */
export const getGoogleUser = async () => {
    try {
        const userInfo = await GoogleSignIn.signIn();
        return userInfo;
    } catch (error) {
        if (error?.code === GoogleSignInErrorCode.SIGN_IN_CANCELLED)
            throw GoogleSigninCancelledSignal;

        if (error?.code === GoogleSignInErrorCode.PLAY_SERVICES_NOT_AVAILABLE)
            throw simplifyError('error', 'google_sign_in_play_services');

        throw error;
    }
}