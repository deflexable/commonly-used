import { TIMESTAMP } from 'react-native-mosquito-transport';
import { PermissionsAndroid, Platform } from 'react-native';
import { DbPath } from 'core/common_values';
import { getMessaging, getToken, isDeviceRegisteredForRemoteMessages, registerDeviceForRemoteMessages, onTokenRefresh } from '@react-native-firebase/messaging';
import { collection } from './client_server';
import bbx_rn_lib, { getMachineCode } from "../src/index";

export const updateNotificationToken = (userId) => {
    let canceller;

    askNotificationPermission().then(async () => {
        if (!(await isDeviceRegisteredForRemoteMessages(getMessaging()))) {
            await registerDeviceForRemoteMessages(getMessaging());
        }

        const updateToken = async (token) =>
            collection(DbPath.notificationToken).mergeOne({ _id: `${userId} ${await getMachineCode()}` }, {
                $set: {
                    token,
                    platform: Platform.OS,
                    user: userId,
                    updatedOn: TIMESTAMP
                }
            });

        if (canceller) return;
        const token = await getToken(getMessaging());

        if (canceller) return;
        updateToken(token);
        canceller = onTokenRefresh(getMessaging(), updateToken);
    }).catch(async e => {
        if (Platform.OS === 'android' || !(await bbx_rn_lib.isEmulator()))
            console.error('updateNotificationToken err:', e);
    });

    return () => {
        if (typeof canceller === 'function') canceller();
        canceller = true;
    }
};

const askNotificationPermission = async () => {
    if (Platform.OS === 'android') {
        if ((await bbx_rn_lib.getApiLevel()) <= 32) return;
        const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (result === 'granted') return;
    } else {
        if (await bbx_rn_lib.requestNotificationPermission()) return;
    }
    throw 'Notification Permission denied';
};