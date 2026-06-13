"use client"

import { useState, useEffect } from 'react';
import { MosquitoTransport } from 'mosquito-transport-js';
import { isBrowser } from "./is_browser";
import { deserializeStorage, serializeStorage } from './cacher';

const MOSQUITO_STORAGE_PATH = 'MOSQUITO_STORAGE_PATH';

if (isBrowser()) {
    MosquitoTransport.initializeCache({
        io: {
            input: async () => {
                console.log('feeding mosquito transport');
                const cacheData = await deserializeStorage(MOSQUITO_STORAGE_PATH);
                return cacheData;
            },
            output: data => {
                serializeStorage(MOSQUITO_STORAGE_PATH, data);
            }
        }
    });
}

/**
 * 
 * @param {import('mosquito-transport-js').MTConfig} options 
 * @returns {MosquitoTransport}
 */
export const createMserver = (options) => {
    const e2ePublicKey = process.env.NEXT_PUBLIC_E2E_Public_Key;

    return isBrowser() ? new MosquitoTransport({
        projectUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        enableE2E_Encryption: !!e2ePublicKey,
        ...e2ePublicKey ? { serverE2E_PublicKey: e2ePublicKey } : {},
        disableCache: false,
        ...options
    }) : undefined;
};

const mserver = isBrowser() ? createMserver() : undefined;

export const useIsOnline = () => {
    const [isOnline, setOnline] = useState(mserver?.isOnline);

    useEffect(() => {
        return mserver.listenReachableServer(connected => {
            setOnline(connected);
        });
    }, []);

    return isOnline;
}

export function collection() { return mserver.collection(...[...arguments]) };
export function auth() { return mserver.auth(...[...arguments]); };
/**
 * @type {MosquitoTransport['fetchHttp']}
 */
export function fetchHttp() { return mserver.fetchHttp(...[...arguments]); }
export function storage() { return mserver.storage(...[...arguments]); };

export default mserver;