import RNMT from 'react-native-mosquito-transport';
import { API_BASE_URL, IS_DEV, E2E_Public_Key, ENABLE_CACHE } from '@this_app_root/env';
import { useEffect, useState } from "react";
import { Scope } from '@this_app_root/src/utils/scope';
import { Endpoints, one_mb } from 'core/common_values';

RNMT.initializeCache({
    maxLocalFetchHttpSize: one_mb * 100,
    maxLocalDatabaseSize: one_mb * 30
});

export const createMserver = extras =>
    new RNMT({
        projectUrl: API_BASE_URL,
        disableCache: !ENABLE_CACHE,
        enableE2E_Encryption: !IS_DEV,
        serverE2E_PublicKey: E2E_Public_Key,
        ...extras
    });

export const mserver = createMserver();

// TODO: resume and cleanup residue mserver

const EmulatedServerCount = {};
const EmulatedServers = {};

/**
 * @param {string} host 
 * @param {any} options 
 * @returns {[import('react-native-mosquito-transport').default, () => void]}
 */
export const emulatedMserver = (host, options) => {
    if (!EmulatedServerCount[host])
        EmulatedServerCount[host] = 0;

    ++EmulatedServerCount[host];

    if (!EmulatedServers[host]) {
        EmulatedServers[host] = new RNMT({
            projectUrl: host,
            enableE2E_Encryption: !IS_DEV,
            serverE2E_PublicKey: E2E_Public_Key,
            disableCache: !ENABLE_CACHE,
            ...options
        });
        EmulatedServers[host].auth().emulate(API_BASE_URL);
    }
    let hasClose;

    return [
        EmulatedServers[host],
        () => {
            if (hasClose) return;
            hasClose = true;
            if (--EmulatedServerCount[host]) return;

            if (host in EmulatedServers) {
                if (IS_DEV) console.warn('cleaning up mt_emulation:', host);
                const destoyPromise = EmulatedServers[host].auth().signOut();
                delete EmulatedServers[host];
                return destoyPromise;
            }
        }
    ];
};

const collection = mserver.collection,
    auth = mserver.auth,
    storage = mserver.storage,
    fetchHttp = mserver.fetchHttp;

const uploadContent = (file, destination, domain, createHash, onProgress) => new Promise((resolve, reject) => {
    const [instanceServer, cleanup] = domain ? emulatedMserver(domain) : [];

    (domain ? instanceServer.storage() : storage())
        .uploadFile(file, destination, (err, url) => {
            if (url) resolve(url);
            else reject(err);
            cleanup?.();
        }, onProgress, { createHash });
});

const deleteContent = async (path, domain) => {
    const [instanceServer, cleanup] = domain ? emulatedMserver(domain) : [];
    await (domain ? instanceServer.storage() : storage()).deleteFile(path);
    cleanup?.();
};

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
    useIsOnline,
    uploadContent,
    deleteContent
};