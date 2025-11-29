export function purifyFilepath(filename: any): string;
/**
 * @type {(callback: import('react-native').ScrollViewProps['onScroll'], offset: number) => Function}
 */
export const useScrollViewPagination: (callback: any["onScroll"], offset: number) => Function;
/**
 * @type {(callback: (index: number) => void, childrenRefs: []) => import('react-native').ScrollViewProps['onScroll']}
 */
export const handleScrollViewChildrenVisibility: (callback: (index: number) => void, childrenRefs: []) => any["onScroll"];
export function usePrefferedSettings(): any;
export function themeStyle(light: any, dark: any): CustomValue;
/**
 * @type {useCustomStyle}
 */
export const useStyle: <T>(init: T, options: {
    prioritiseMap: string | string[];
}) => {
    format: <U>(style: U) => U;
    styles: T;
    windowWidth: number;
    windowHeight: number;
};
export function shouldCover([w1, h1]: [any, any], [w2, h2]: [any, any], threshold?: number): boolean;
export function useGridSpacing({ widthCountMap, spacing, maxWidth }: {
    widthCountMap: any;
    spacing: any;
    maxWidth: any;
}): {
    width: number;
    spacing: any;
    counts: any;
    windowWidth: any;
    windowHeight: any;
};
export function showToast(message: any, type: any): void;
export function alertNull(title: any, message: any, onPress: any, dismissTxt: any, cancelable: any, onDismiss: any): void;
export function alertDialog(title: any, message: any, onYesPress: any, onNoPress: any, yesTxt: any, noTxt: any, cancelable: any, onDismiss: any, maybeOnpress: any, maybeTxt: any): void;
export function prefixStoragePath(path: any, prefix?: string): string;
export function alertError(e: any): void;
import { CustomValue } from "./styling";
