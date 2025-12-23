import RNMT from 'react-native-mosquito-transport';
import { API_BASE_URL, IS_DEV, E2E_Public_Key, ENABLE_CACHE } from '@this_app_root/env';
import { useEffect, useState } from "react";
import { Scope } from '@this_app_root/src/utils/scope';
import { Endpoints, one_mb } from 'core/common_values';

RNMT.initializeCache({
    maxLocalFetchHttpSize: one_mb * 100,
    maxLocalDatabaseSize: one_mb * 30
});

/**
 * @type {(options?: import('react-native-mosquito-transport').RNMTConfig) => import('react-native-mosquito-transport').default}
 */
export const createMserver = extras =>
    new RNMT({
        projectUrl: API_BASE_URL,
        disableCache: !ENABLE_CACHE,
        enableE2E_Encryption: !IS_DEV,
        serverE2E_PublicKey: E2E_Public_Key,
        ...extras
    });

/**
 * @type {import('react-native-mosquito-transport').default}
 */
export const mserver = createMserver();

const collection = mserver.collection,
    auth = mserver.auth,
    storage = mserver.storage,
    fetchHttp = mserver.fetchHttp;

mserver.listenReachableServer(connected => {
    Scope.IS_ONLINE = connected;
    console.warn('appConnection:', connected);
});

const useIsOnline = () => {
    const [isOnline, setOnline] = useState(Scope.IS_ONLINE);

    useEffect(() => {
        return mserver.listenReachableServer(connected => {
            setOnline(connected);
        });
    }, []);

    return isOnline;
}

if (Endpoints?.getIpAddresslocation)
    fetchHttp(Endpoints.getIpAddresslocation, undefined, { disableAuth: true, retrieval: 'cache-await' }).then(async r => {
        r = await r.json();
        Scope.ipAddressData = r;
    });

export {
    collection,
    auth,
    fetchHttp,
    storage,
    useIsOnline
};