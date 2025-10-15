/**
 * Open a file picker dialog to select files from the device storage.
 *
 * @type {(types: string | import('@react-native-documents/picker').PredefinedFileTypes | Array<import('@react-native-documents/picker').PredefinedFileTypes | string>, multiple?: boolean) => Promise<import('@react-native-documents/picker').DocumentPickerResponse | Array<import('@react-native-documents/picker').DocumentPickerResponse>>}
 */
export const pickFile: (types: string | any | Array<any | string>, multiple?: boolean) => Promise<any | Array<any>>;
