#import "BbxCommonlyUsed.h"
#import "DeviceUID.h"
#import <UserNotifications/UserNotifications.h>

@implementation BbxCommonlyUsed

- (BOOL)isEmulator
{
#if TARGET_IPHONE_SIMULATOR
    return YES;
#else
    return NO;
#endif
}

- (void)isEmulator:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
    resolve(@([self isEmulator]));
}

- (NSString *)uniqueId
{
    return [DeviceUID uid];
}

- (void)getUniqueId:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
    resolve([self uniqueId]);
}

- (void)requestNotificationPermission:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject
{
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {

        switch (settings.authorizationStatus) {

            case UNAuthorizationStatusAuthorized:
            case UNAuthorizationStatusProvisional:
            case UNAuthorizationStatusEphemeral:
                resolve(@(YES));
                break;

            case UNAuthorizationStatusDenied:
                resolve(@(NO));
                break;

            case UNAuthorizationStatusNotDetermined: {
                [center requestAuthorizationWithOptions:
                    (UNAuthorizationOptionAlert |
                     UNAuthorizationOptionBadge |
                     UNAuthorizationOptionSound)
                    completionHandler:^(BOOL granted, NSError * _Nullable error) {

                    if (error) {
                        reject(@"NOTIFICATION_PERMISSION_ERROR",
                               error.localizedDescription,
                               error);
                        return;
                    }

                    resolve(@(granted));
                }];
                break;
            }
        }
    }];
}

- (void)getApiLevel:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
    reject(@"NOT_SUPPORTED",
           @"getApiLevel() method is unsupported on iOS",
           nil);
}

- (void)hasGms:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
    reject(@"NOT_SUPPORTED",
           @"hasGms() method is unsupported on iOS",
           nil);
}

- (void)hasHms:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
    reject(@"NOT_SUPPORTED",
           @"hasHms() method is unsupported on iOS",
           nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeBbxCommonlyUsedSpecJSI>(params);
}

+ (NSString *)moduleName
{
    return @"BbxCommonlyUsed";
}

@end