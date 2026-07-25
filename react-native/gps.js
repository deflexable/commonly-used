import { PermissionsAndroid, Platform } from "react-native";
import { GEO_JSON } from "react-native-mosquito-transport";
import { DbPath } from "core/common_values";
import { collection, mserver } from "./client_server";
import { Scope } from "@/src/utils/scope";
import { JSONCacher } from "@/src/utils/cacher";
import Geolocation from "react-native-get-location";
import { promptForEnableLocationIfNeeded } from "react-native-android-location-enabler";
import { updateUserCacheData } from "@/src/utils/auth_util";

/**
 * @param {boolean} force 
 * @returns {Promise<[number, number]>}
 */
export const getCoords = async (force = false, nice = true) => {
    try {
        if (!force) {
            const prevPrecise = JSONCacher.PRECISE_COORDS;
            if (prevPrecise) return prevPrecise;
        }

        if (!Scope.preciseCoordsPromise)
            Scope.preciseCoordsPromise = (async () => {
                let wasPermitted;
                if (Platform.OS === 'android') {
                    const permissions = [
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
                    ];
                    for (const perm of permissions) {
                        const result = await PermissionsAndroid.request(perm);
                        console.log('location result:', result, ' for:', perm);
                        if (perm === permissions[0] && result === 'granted') wasPermitted = true;
                    }

                    if (!wasPermitted && JSONCacher.PRECISE_COORDS) throw 'location permission denied';
                }

                if (wasPermitted && Platform.OS === 'android')
                    try {
                        await promptForEnableLocationIfNeeded();
                    } catch (error) {
                        console.warn('gps turn-on res:', error);
                    }

                console.log('getting fresh location');
                let coords;

                for (const enableHighAccuracy of [true, false]) {
                    try {
                        console.log('getting enableHighAccuracy:', enableHighAccuracy);
                        coords = await Geolocation.getCurrentPosition({
                            enableHighAccuracy,
                            timeout: 20_000
                        }).then(r => [r.latitude, r.longitude]);
                        break;
                    } catch (error) {
                        if (enableHighAccuracy) {
                            const prevPrecise = JSONCacher.PRECISE_COORDS;
                            if (prevPrecise) {
                                coords = prevPrecise;
                                break;
                            }
                        } else throw error;
                    }
                }

                JSONCacher.PRECISE_COORDS = coords;
                console.log('got location coord:', coords);
                return coords;
            })();

        const promise = await Scope.preciseCoordsPromise;
        return promise;
    } catch (error) {
        console.error('getAccurateLocation err:', error);
        if (Scope.preciseCoordsPromise) Scope.preciseCoordsPromise = undefined;
        const prevLL = JSONCacher.PRECISE_COORDS;
        if (prevLL) return prevLL;

        if (nice) {
            const niceLoc = getCoordsSync();
            if (niceLoc) return niceLoc;
        }
        throw error;
    } finally {
        const ll = JSONCacher.PRECISE_COORDS;

        console.log('do location upload ll:', ll, ' prev:', Scope.uploadedPreciseCoords);
        if (Scope.user && ll && Scope.uploadedPreciseCoords !== `${ll}`) {
            console.log('sending loc');
            collection(DbPath.users).updateOne({ _id: Scope.user.uid }, {
                $set: {
                    location: GEO_JSON(...ll)
                }
            }).then(() => {
                if (mserver.isOnline) // TODO: await online instead
                    setTimeout(updateUserCacheData, 5000);
            });
            Scope.uploadedPreciseCoords = `${ll}`;
        }
    }
};

export const getCoordsSync = () => {
    let coords = JSONCacher.PRECISE_COORDS;

    if (!coords) {
        coords = Scope.userData?.location?.coordinates;
        if (Array.isArray(coords)) {
            coords = coords.slice(0).reverse();
        } else if (!Array.isArray(coords = Scope.user?.metadata?.location?.slice?.(0))) {
            coords = Scope.ipAddressData?.ll?.slice?.(0);
        }
    }
    return coords;
}