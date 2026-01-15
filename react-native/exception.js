import { getCrashlytics, recordError } from "@react-native-firebase/crashlytics";
import { simplifyCaughtError } from "simplify-error";

export const recordException = (error, name) => {
    if (!(error instanceof Error)) {
        error = simplifyCaughtError(error).simpleError;
        error = new Error(`${error?.error}: ${error?.message}`);
    }
    return recordError(getCrashlytics(), error, name);
}