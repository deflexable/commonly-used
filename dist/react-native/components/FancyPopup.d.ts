export default function _default(): import("react/jsx-runtime").JSX.Element[];
export function hideFancyDialog(id: any): void;
export function useFancyDialog(): {
    openFancyDialog: (o: any) => any;
    hideFancyDialog: (id: any) => void;
};
export function showFancyDialog({ img, topComponent, title, message, des, onYes, yesTxt, noTxt, onNo, hideYes, hideNo, flexer, lockModal, onDismiss, id }: {
    img: any;
    topComponent: any;
    title: any;
    message: any;
    des: any;
    onYes: any;
    yesTxt: any;
    noTxt: any;
    onNo: any;
    hideYes: any;
    hideNo: any;
    flexer: any;
    lockModal: any;
    onDismiss: any;
    id: any;
}): any;
export function usePageLoadingUI(): {
    isLoaderVisible: undefined;
    showLoader: (message: any) => void;
    hideLoader: () => void;
};
