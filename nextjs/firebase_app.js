import { initializeApp } from "firebase/app";
import { isBrowser } from "./is_browser";

const firebase_app =
    isBrowser() ?
        initializeApp(
            Object.fromEntries(
                process.env.NEXT_PUBLIC_FIREBASE_CONFIG
                    .split('&')
                    .map(v => v.split('='))
            )
        ) : undefined;

export default firebase_app;