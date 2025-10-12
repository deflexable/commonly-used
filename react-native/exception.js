import { getCrashlytics, recordError } from "@react-native-firebase/crashlytics";

export const recordException = (error, name) =>
    recordError(getCrashlytics(), error instanceof Error ? error : new Error(error), name);