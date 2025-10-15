export function getTimezoneOffset(tz: any): number;
export function downloadBuffer({ data, href, type, rename }: {
    data: any;
    href: any;
    type?: string;
    rename: any;
}): void;
export function listenLazyScroll(callback: any, selector: any, offSet?: number): () => void;
export function useLazyScroll(callback: any, selector: any, offset: any): any;
export function useBodyLazyScroll(callback: any): any;
export function useBodyScrollBlocker(block: any): void;
export function useDisableBackButton(callback: any, enabled?: boolean): any;
export function getImageRect(file: any, options: any): Promise<any>;
export function fileToBase64(file: any): Promise<any>;
