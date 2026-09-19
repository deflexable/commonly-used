// @flow
import { TurboModuleRegistry, type TurboModule, type EventEmitter } from 'react-native';

export interface Spec extends TurboModule {
  getApiLevel(): Promise<number>;
  hasGms(): Promise<boolean>;
  hasHms(): Promise<boolean>;
  getUniqueId(): Promise<string>;
  isEmulator(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
  getCurrentLocale(): Promise<string>;

  // events
  readonly onLocaleChanged: EventEmitter<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BbxCommonlyUsed');
