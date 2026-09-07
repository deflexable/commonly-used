import { useMemo } from "react"

function isObject(o) {
    if (typeof o !== 'object' || o === null) return false;
    return Object.prototype.toString.call(o) === '[object Object]'
        && Object.getPrototypeOf(o) === Object.prototype;
}

const CacheSignal = Symbol('proxy-function-cache');

export const createCacheFunction = (callback, depsCallback) => {
    return { __proxy_signal: CacheSignal, callback, deps: depsCallback };
}

/**
 * @template T
 * @param {T} styling
 * @param {any} feeder
 * @returns {T}
 */
export const useProxyFunction = (styling, feeder) =>
    useMemo(() => proxyFunction(styling, feeder, true), [styling, feeder]);

export function proxyFunction(object, feeder, deepNested = true, cacheMap) {
    let shouldProxy;
    let remaps;

    for (const key in object) {
        if (!Object.hasOwn(object, key)) continue;

        const value = object[key];

        if (typeof value === 'function') {
            shouldProxy = true;
            if (!remaps) remaps = {};
            remaps[key] = value(feeder);
        } else if (value?.__proxy_signal === CacheSignal) {
            if (!(cacheMap instanceof Map)) throw 'cache map was not provided internally';
            shouldProxy = true;
            if (!remaps) remaps = {};
            const { callback, deps } = value;
            const prevCache = cacheMap.get(callback);
            const depResult = deps(feeder);
            let result;

            if (
                !cacheMap.has(callback) ||
                !Array.isArray(depResult) ||
                !Array.isArray(prevCache?.[1]) ||
                (
                    depResult.length &&
                    depResult.some((v, i) => prevCache?.[1]?.[i] !== v)
                )
            ) {
                result = callback(feeder);
                cacheMap.set(callback, [result, depResult]);
            } else result = prevCache[0];

            remaps[key] = result;
        } else if (deepNested && isObject(value)) {
            const data = proxyFunction(value, feeder, deepNested);

            if (data.proxable) {
                shouldProxy = true;
                remaps[key] = data.proxable;
            }
        }
    }

    if (shouldProxy) {
        return {
            proxable:
                new Proxy(object, {
                    get: (_, n) => {
                        if (remaps.hasOwnProperty(n))
                            return remaps[n];
                        return object[n];
                    }
                })
        };
    }

    return { object };
};