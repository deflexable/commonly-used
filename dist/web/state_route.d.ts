/**
 * @type {() => ({ restoreData: {[key: string]: any}, wasRestore: boolean })}
 */
export const useRouteState: () => ({
    restoreData: {
        [key: string]: any;
    };
    wasRestore: boolean;
});
