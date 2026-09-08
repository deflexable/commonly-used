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
    useMemo(() => {
        const result = proxyFunction(styling, feeder, true);
        return result.proxable || result.object;
    }, [styling, feeder]);

export function proxyFunction(object, feeder, deepNested = true, cacheMap) {
    let remaps;

    for (const key in object) {
        if (!Object.hasOwn(object, key)) continue;

        const value = object?.[key];

        if (typeof value === 'function') {
            if (!remaps) remaps = {};
            remaps[key] = value(feeder);
        } else if (value?.__proxy_signal === CacheSignal) {
            if (!(cacheMap instanceof Map)) throw 'cache map was not provided internally';
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
            const data = proxyFunction(value, feeder, deepNested, cacheMap);

            if (data.proxable) {
                if (!remaps) remaps = {};
                remaps[key] = data.proxable;
            }
        }
    }

    if (remaps) {
        return {
            proxable: {
                ...object,
                ...remaps
            }
        };
    }

    return { object };
};