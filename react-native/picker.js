import { errorCodes, keepLocalCopy, pick } from "@react-native-documents/picker";
import { recordException } from "./exception";
import { alertError, prefixStoragePath } from "./page_helper";

export const pickFile = async (types, multiple = true) => {
    try {
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
        console.log('pickErr:', e);
        if (e?.code !== errorCodes.OPERATION_CANCELED) {
            alertError(undefined, e);
            recordException(e, 'FILE_PICKER');
        }
        throw e;
    }
};