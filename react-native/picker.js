import { errorCodes, keepLocalCopy, pick, types as pickerTypes } from "@react-native-documents/picker";
import { recordException } from "./exception";
import { alertError, prefixStoragePath } from "./page_helper";
import { Platform } from "react-native";
import { transformMediaResult, pickMedia } from "./pick_media";

/**
 * Open a file picker dialog to select files from the device storage.
 * 
 * @type {(types: string | import('@react-native-documents/picker').PredefinedFileTypes | Array<import('@react-native-documents/picker').PredefinedFileTypes | string>, multiple?: boolean | number) => Promise<import('@react-native-documents/picker').DocumentPickerResponse | Array<import('@react-native-documents/picker').DocumentPickerResponse>>}
 */
export const pickFile = async (types, multiple = true) => {
    if (typeof multiple === 'number' && multiple <= 0) return [];

    if (Platform.OS !== 'android') {
        const filterTypes = Array.isArray(types) ? types : [types];

        const isImage = filterTypes.includes(pickerTypes.images);
        const isVideo = filterTypes.includes(pickerTypes.video);

        if (isImage || isVideo) {
            return pickMedia({ isImage, isVideo, multiple });
        }
    }

    try {
        const results = await Promise.all(
            (
                await pick({
                    type: types,
                    allowMultiSelection: !!multiple
                })
            ).map(async result => {
                if (!result.uri.startsWith('file://'))
                    await keepLocalCopy({
                        destination: 'cachesDirectory',
                        files: [{ fileName: result.name, uri: result.uri }]
                    }).then(([r]) => {
                        if (r.copyError) throw r.copyError;
                        if (r.status === 'error') throw 'unable to mount file';
                        result.uri = r.localUri;
                    });

                result.uri = prefixStoragePath(result.uri);
                return result;
            })
        );

        console.log('results =', results);
        return transformMediaResult(results, multiple);
    } catch (e) {
        if (e?.code !== errorCodes.OPERATION_CANCELED) {
            alertError(e);
            recordException(e, 'FILE_PICKER');
        }
        throw e;
    }
};