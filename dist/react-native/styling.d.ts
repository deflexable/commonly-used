export class CustomValue {
    constructor(map: any);
    mapf: any;
}
export function useCustomStyle<T>(init: T, options: {
    prioritiseMap: string | string[];
}): {
    format: <U>(style: U) => U;
    styles: T;
    windowWidth: number;
    windowHeight: number;
};
