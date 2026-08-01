// @flow
import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getApiLevel(): Promise<number>;
  hasGms(): Promise<boolean>;
  hasHms(): Promise<boolean>;
  getUniqueId(): Promise<string>;
  isEmulator(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;

  // event listeners
  // readonly onMessage?: EventEmitter<{ message: string }>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BbxCommonlyUsed');
