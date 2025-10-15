export function purifyFilepath(filename: any): string;
/**
 * @type {(callback: import('react-native').ScrollViewProps['onScroll'], offset: number) => Function}
 */
export const useScrollViewPagination: (callback: import("react-native").ScrollViewProps["onScroll"], offset: number) => Function;
/**
 * @type {(callback: (index: number) => void, childrenRefs: []) => import('react-native').ScrollViewProps['onScroll']}
 */
export const handleScrollViewChildrenVisibility: (callback: (index: number) => void, childrenRefs: []) => import("react-native").ScrollViewProps["onScroll"];
export function shouldCover([w1, h1]: [any, any], [w2, h2]: [any, any], threshold?: number): boolean;
export function useGridSpacing({ widthCountMap, spacing, maxWidth }: {
    widthCountMap: any;
    spacing: any;
    maxWidth: any;
}): {
    width: number;
    spacing: any;
    counts: any;
    windowWidth: number;
    windowHeight: number;
};
export function showToast(message: any, type: any): void;
export function alertNull(locales: any, isDarkMode: any, title: any, message: any, onPress: any, dismissTxt: any, cancelable: any, onDismiss: any): void;
export function alertDialog(locales: any, isDarkMode: any, title: any, message: any, onYesPress: any, onNoPress: any, yesTxt: any, noTxt: any, cancelable: any, onDismiss: any, maybeOnpress: any, maybeTxt: any): void;
export function prefixStoragePath(path: any, prefix?: string): string;
export function alertError(locales: any, e: any): void;
