import { recordException } from "./exception";
import { alertError } from "./page_helper";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { simplifyError } from "simplify-error";

export const CancellationSignal = Symbol('operation_aborted');

/**
 * 
 * @param {{ isImage?: boolean, isVideo?: boolean, multiple?: boolean | number }} param0 
 * @returns {Promise<MediaResponse | MediaResponse[]>}
 */
export const pickMedia = async ({ isImage, isVideo, multiple = true }) => {
    try {
        if (typeof multiple === 'number' && multiple <= 0) return [];

        if (!isImage && !isVideo) throw 'unsupported mime type';

        const res =
            await launchImageLibrary({
                mediaType: (isImage && isVideo) ? 'mixed' : isImage ? 'photo' : 'video',
                includeExtra: false,
                selectionLimit: typeof multiple === 'number' ? multiple : multiple ? undefined : 1
            });
        if (res.didCancel) throw CancellationSignal;

        if (res.errorMessage || res.errorCode) throw simplifyError(res.errorCode, res.errorMessage);
        const reformattedResult = res.assets.map(v => reformatGalleryData(v));

        return transformMediaResult(reformattedResult, multiple);
    } catch (e) {
        if (e === CancellationSignal) throw e.description;

        alertError(e);
        recordException(e, 'OPEN_CAMERA');
        throw e;
    }
};

export const transformMediaResult = (results, multiple) =>
    Number.isInteger(multiple) ? results.slice(0, multiple) : multiple ? results : results[0];

export const reformatGalleryData = v => ({
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
 * @returns {Promise<MediaResponse | MediaResponse[]>}
 */
export const openCamera = async (options) => {
    try {
        const multiple = options?.multiple;
        if (typeof multiple === 'number' && multiple <= 0) return [];

        const res = await launchCamera(options);
        if (res.didCancel) throw CancellationSignal;
        if (res.errorMessage || res.errorCode) throw simplifyError(res.errorCode, res.errorMessage);
        const results = res.assets.map(v => reformatGalleryData(v));

        return transformMediaResult(results, multiple);
    } catch (e) {
        if (e === CancellationSignal) throw e.description;

        alertError(e);
        recordException(e, 'OPEN_CAMERA');
        throw e;
    }
}