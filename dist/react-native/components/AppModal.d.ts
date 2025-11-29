export default AppModal;
export const PlainModalBG: any[];
export type SnapSheetModalExtraProps = {
    modalName?: string;
    navigationGesture?: any;
    modalBackGround?: [string, string];
};
/**
 * @typedef {object} SnapSheetModalExtraProps
 * @property {string} [modalName]
 * @property {any} [navigationGesture]
 * @property {[string, string]} [modalBackGround]
 */
/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native-snap-sheet').SnapSheetModal> & SnapSheetModalExtraProps>}
 */
declare const AppModal: React.FC<React.ComponentProps<typeof import("react-native-snap-sheet").SnapSheetModal> & SnapSheetModalExtraProps>;
import React from 'react';
