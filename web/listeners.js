import SubscriptionListener from "subscription-listener";
import { isBrowser } from "./is_browser";

export const CentralizeListener = isBrowser() ? new SubscriptionListener() : undefined;