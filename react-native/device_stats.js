import { Platform } from "react-native";
import { getApiLevel, getDeviceName, getManufacturer, getIpAddress, getUniqueId, getTotalDiskCapacity, getTotalMemory, getSystemName, getInstallerPackageName, getDeviceType, getFirstInstallTime } from "react-native-device-info";
import { Scope } from "@this_app_root/src/utils/scope";
import { TIMESTAMP } from "react-native-mosquito-transport";
import { DbPath, niceTry } from "core/common_values";
import { collection } from "./client_server";

const releaseDeviceInfo = async () => {
    let resolveCallback;
    Scope.deviceStats = new Promise(resolve => {
        resolveCallback = resolve;
    });

    const promises = [
        { key: 'deviceName', promise: getDeviceName() },
        { key: 'manu', promise: getManufacturer() },
        { key: 'ip', promise: getIpAddress() },
        { key: 'machineCode', promise: getUniqueId() },
        // { key: 'phoneNo', promise: getPhoneNumber() }, TODO:
        { key: 'storage', promise: getTotalDiskCapacity() },
        { key: 'memory', promise: getTotalMemory() },
        { key: 'system_name', promise: Promise.resolve(getSystemName()) },
        { key: 'installer', promise: getInstallerPackageName() },
        { key: 'deviceType', promise: getDeviceType() },
        { key: 'lastInstalled', promise: getFirstInstallTime() }
    ];

    if (Platform.OS === 'android') promises.push({ key: 'apiVersion', promise: getApiLevel() });

    const stats = Object.fromEntries(
        (
            await Promise.all(promises.map(async v =>
                [v.key, await niceTry(() => v.promise)]
            ))
        ).filter(([_, v]) => v && v !== 'unknown')
    );
    
    resolveCallback(stats);
}

releaseDeviceInfo();

export const uploadUserDeviceInfo = async () => {
    const stats = await Scope.deviceStats;

    await collection(DbPath.userDeviceInfo).putOne({
        _id: `${Scope.user.uid} ${await Scope.machineCode}`
    }, {
        ...stats,
        user: Scope.user.uid,
        platform: Platform.OS,
        updatedOn: TIMESTAMP
    });
}