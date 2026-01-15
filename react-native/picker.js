import { errorCodes, keepLocalCopy, pick, types as pickerTypes } from "@react-native-documents/picker";
import { recordException } from "./exception";
import { alertError, prefixStoragePath } from "./page_helper";
import { Platform } from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { simplifyError } from "simplify-error";

/**
 * Open a file picker dialog to select files from the device storage.
 * 
 * @type {(types: string | import('@react-native-documents/picker').PredefinedFileTypes | Array<import('@react-native-documents/picker').PredefinedFileTypes | string>, multiple?: boolean | number) => Promise<import('@react-native-documents/picker').DocumentPickerResponse | Array<import('@react-native-documents/picker').DocumentPickerResponse>>}
 */
export const pickFile = async (types, multiple = true) => {
    try {
        const filterTypes = Array.isArray(types) ? types : [types];

        if (Platform.OS !== 'android') {
            const isImage = filterTypes.includes(pickerTypes.images);
            const isVideo = filterTypes.includes(pickerTypes.video);

            if (isImage || isVideo) {
                const res =
                    await launchImageLibrary({
                        mediaType: (isImage && isVideo) ? 'mixed' : isImage ? 'photo' : 'video',
                        includeExtra: false,
                        selectionLimit: typeof multiple === 'number' ? multiple : multiple ? undefined : 1
                    });
                if (res.didCancel) throw { code: errorCodes.OPERATION_CANCELED };
                if (res.errorMessage || res.errorCode) throw simplifyError(res.errorCode, res.errorMessage);
                const reformattedResult = res.assets.map(v => reformatGalleryData(v));

                return multiple ? reformattedResult : reformattedResult[0];
            }
        }

        const results = await Promise.all(
            (
                await pick({
                    type: types,
                    allowMultiSelection: multiple
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
        return multiple ? results : results[0];
    } catch (e) {
        if (e?.code !== errorCodes.OPERATION_CANCELED) {
            alertError(e);
            recordException(e, 'FILE_PICKER');
        }
        throw e;
    }
};

const reformatGalleryData = v => ({
    uri: v.uri,
    name: v.fileName,
    type: v.type,
    size: v.fileSize,
    data: { ...v }
});

/**
 * capture a photo or record a video from in-built camera app of the device
 * 
 * @param {import("react-native-image-picker").CameraOptions} options 
 * @returns {Promise<{uri: string, name: string, type: string, size: string, data: import("react-native-image-picker").ImagePickerResponse}[]>}
 */
export const openCamera = async (options) => {
    try {
        const res = await launchCamera(options);
        if (res.didCancel) throw { code: errorCodes.OPERATION_CANCELED };
        if (res.errorMessage || res.errorCode) throw simplifyError(res.errorCode, res.errorMessage);
        return res.assets.map(v => reformatGalleryData(v));
    } catch (e) {
        if (e?.code !== errorCodes.OPERATION_CANCELED) {
            alertError(e);
            recordException(e, 'OPEN_CAMERA');
        }
        throw e;
    }
}