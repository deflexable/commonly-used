/**
 * @type {(options?: import('react-native-mosquito-transport').RNMTConfig) => import('react-native-mosquito-transport').default}
 */
export const createMserver: (options?: import("react-native-mosquito-transport").RNMTConfig) => import("react-native-mosquito-transport").default;
/**
 * @type {import('react-native-mosquito-transport').default}
 */
export const mserver: import("react-native-mosquito-transport").default;
export function emulatedMserver(host: string, options: any): [import("react-native-mosquito-transport").default, () => void];
export const collection: (path: string) => import("react-native-mosquito-transport", { with: { "resolution-mode": "import" } }).RNMTCollection;
export const auth: () => import("react-native-mosquito-transport", { with: { "resolution-mode": "import" } }).RNMTAuth;
export const fetchHttp: (endpoint: string, init?: RequestInit, config?: import("react-native-mosquito-transport", { with: { "resolution-mode": "import" } }).FetchHttpConfig) => Promise<import("react-native-mosquito-transport", { with: { "resolution-mode": "import" } }).FetchHttpResponse>;
export const storage: () => import("react-native-mosquito-transport", { with: { "resolution-mode": "import" } }).RNMTStorage;
export function useIsOnline(): any;
export function uploadContent(file: any, destination: any, domain: any, createHash: any, onProgress: any): Promise<any>;
export function deleteContent(path: any, domain: any): Promise<void>;
