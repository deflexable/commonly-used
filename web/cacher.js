import { isBrowser } from './is_browser.js';
import { ENV } from './server_variables.js';
import { WEB_SCOPE } from "website/app/utils/scope.js";

let counter = 0;

export const serializeStorage = async (key, value) => {
    if (!isBrowser()) throw 'serializeStorage only supported on a web client';

    const session = `set-${key}${Math.random()}${++counter}`;

    await executeIframe({
        iframeID: 'sso-auth-iframe',
        inputData: { signal: 'set-localstorage', data: { session, path: key, value } },
        handler: (event, resolve) => {
            if (event.origin === ENV.SSO_AUTH_URL) {
                const { signal, session: thisSession } = event.data;
                if (
                    signal === 'respond-set-localstorage' &&
                    thisSession === session
                ) {
                    resolve();
                }
            }
        }
    });
}

export const deserializeStorage = async (key) => {
    if (!isBrowser()) throw 'deserializeStorage only supported on a web client';

    try {
        const session = `get-${key}${Math.random()}${++counter}`;

        const cacheData = await executeIframe({
            iframeID: 'sso-auth-iframe',
            inputData: { signal: 'get-localstorage', data: { session, path: key } },
            handler: (event, resolve) => {
                if (event.origin === ENV.SSO_AUTH_URL) {
                    const { signal, session: thisSession, data } = event.data;
                    if (
                        signal === 'respond-get-localstorage' &&
                        thisSession === session
                    ) {
                        resolve(data);
                    }
                }
            }
        });

        return cacheData;
    } catch (e) {
        console.error('deserializeStorage key:', key, ' err:', e);
    }
    return null;
}

export const SSO_ReadyPromise = isBrowser() ?
    new Promise(resolve => {
        WEB_SCOPE.ssoReadyCallback = resolve;
    })
    : undefined;

function documentLoaded() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // If the document is already loaded, resolve the promise immediately
            resolve();
        } else {
            // Otherwise, wait for the DOMContentLoaded event
            const loadListener = function () {
                resolve();
                document.removeEventListener('DOMContentLoaded', loadListener);
            };
            document.addEventListener('DOMContentLoaded', loadListener);
        }
    });
}

const executeIframe = async ({
    inputData,
    iframeID,
    handler
}) => {
    try {
        await documentLoaded();
        await SSO_ReadyPromise;
        const iframe = document.getElementById(iframeID);
        if (inputData) iframe.contentWindow.postMessage(inputData, '*');

        const output = await new Promise((resolve, reject) => {
            const ssoListener = function (event) {
                handler(event, resolution => {
                    resolve(resolution);
                    window.removeEventListener('message', ssoListener);
                }, err => {
                    reject(err);
                    window.removeEventListener('message', ssoListener);
                });
            }
            window.addEventListener('message', ssoListener);
        });

        return output;
    } catch (error) {
        console.error('executeIframe err:', error, ' location:', window?.self?.location?.href);
        throw error;
    }
}