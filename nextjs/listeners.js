import SubscriptionListener from "subscription-listener";
import { isBrowser } from "./is_browser";

export const listeners = isBrowser() ? new SubscriptionListener() : undefined;

export const internal_keys = {
    PREFFED_SETTINGS: 'PREFFED_SETTINGS',
    PAGE_LOADING_TRANSITION: 'PAGE_LOADING_TRANSITION',
    FANCY_DIALOG: 'FANCY_DIALOG',
    SHARE_DIALOG: 'SHARE_DIALOG'
};