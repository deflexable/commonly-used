import { MosquitoTransport } from 'mosquito-transport-js';
import { isBrowser } from "./is_browser";
import { ENV } from './server_variables';
import { deserializeStorage, serializeStorage } from './cacher';
import { WEB_STATE } from './scope';
import { useState, useEffect } from 'react';

const MOSQUITO_STORAGE_PATH = 'MOSQUITO_STORAGE_PATH';

export const releaseMosquitoCache = () => {
    if (isBrowser()) {
        MosquitoTransport.initializeCache({
            io: {
                input: async () => {
                    if (ENV.IS_DEV) console.log('feeding mosquito transport');
                    const cacheData = await deserializeStorage(MOSQUITO_STORAGE_PATH);
                    return cacheData;
                },
                output: data => {
                    serializeStorage(MOSQUITO_STORAGE_PATH, data);
                }
            }
        });
    }
}
/**
 * 
 * @param {import('mosquito-transport-js').MTConfig} options 
 * @returns {MosquitoTransport}
 */
const mserver = (options) => {
    const { API_BASE_URL, E2E_Public_Key } = ENV;

    return isBrowser() ? new MosquitoTransport({
        projectUrl: API_BASE_URL,
        enableE2E_Encryption: !!E2E_Public_Key,
        serverE2E_PublicKey: E2E_Public_Key,
        disableCache: false,
        ...options
    }) : undefined;
};

if (isBrowser()) {
    const timer = setInterval(() => {
        try {
            if (!ENV?.API_BASE_URL) return;
        } catch (_) { return; }
        clearInterval(timer);
        mserver().listenReachableServer(connected => {
            WEB_STATE.isOnline = connected;
        });
    }, 3);
}

const useIsOnline = () => {
    const [isOnline, setOnline] = useState(WEB_STATE.isOnline);

    useEffect(() => {
        return listenReachableServer(connected => {
            setOnline(connected);
        });
    }, []);

    return isOnline;
}

function collection() { return mserver().collection(...[...arguments]) };
function auth() { return mserver().auth(...[...arguments]); };
/**
 * @type {MosquitoTransport['fetchHttp']}
 */
function fetchHttp() { return mserver().fetchHttp(...[...arguments]); }
function storage() { return mserver().storage(...[...arguments]); };
function listenReachableServer() { return mserver().listenReachableServer(...[...arguments]); };

export {
    collection,
    auth,
    storage,
    fetchHttp,
    listenReachableServer,
    useIsOnline
};

export default mserver;