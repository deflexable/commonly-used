import { useSearchSuggestionCore } from "../shared/search-core";
import { GEO_JSON, TIMESTAMP } from "react-native-mosquito-transport";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { mserver } from "./client_server";

export const useSearchSuggestion =
    useSearchSuggestionCore({
        GEO_JSON: GEO_JSON,
        TIMESTAMP: TIMESTAMP,
        logEvent: logEvent,
        getAnalytics,
        mserver: mserver
    });