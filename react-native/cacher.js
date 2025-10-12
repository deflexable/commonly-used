import AsyncStorage from '@react-native-async-storage/async-storage';

export const serializeStorage = async (key, value) => {
    try {
        if (value === null || value === undefined)
            return AsyncStorage.removeItem(key);
        if (typeof value !== 'string')
            throw `invalid value supplied to serializeStorage(), second argument must be a string`;

        await AsyncStorage.setItem(key, value);
    } catch (e) {
        console.error('serializeStorage ', key, ' err:', e);
        throw e;
    }
}

export const deserializeStorage = async (key, callback) => {
    let output, error;

    try {
        output = await AsyncStorage.getItem(key);
    } catch (e) {
        console.error('deserializeStorage ', key, ' err:', e);
        error = e;
    }
    if (callback) callback(output, error);
    return output;
};

export const makeCacher = () => {
    const InstantCacheData = {};

    return new Proxy({}, {
        get: (_, n) => {
            if (InstantCacheData.hasOwnProperty(n)) return InstantCacheData[n];
            InstantCacheData[n] = undefined;
            deserializeStorage(n).then(v => {
                InstantCacheData[n] = JSON.parse(v);
            });
            return undefined;
        },
        set: (_, n, v) => {
            serializeStorage(n, JSON.stringify(InstantCacheData[n] = v));
            return true;
        }
    });
}