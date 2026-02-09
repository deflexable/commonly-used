import SubscriptionListener from "subscription-listener";
import { isBrowser } from "bbx-commonly-used/web/is_browser";

export const CentralizeListener = isBrowser() ? new SubscriptionListener() : undefined;