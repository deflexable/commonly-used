import { DbPath } from "core/common_values";
import { randomString } from "../../common/methods";
import { timeoutFetch } from "../fetcher";
import importer from "../importer";

const { collection } = await importer('./mserver.js');
const { INTER_SERVER_PASSKEY } = await importer('./env.js');

export default function delete_remote_media(path, domain, isFile) {
    const isFolder = isFile ? 'no' : 'yes';

    const task = randomString(30);

    return collection(DbPath.microserversTasks).insertOne({
        _id: task,
        domain,
        task: 'deleteMedia',
        data: { path, folder: isFolder }
    }).finally(() =>
        timeoutFetch(domain.concat('/deleteMedia'), {
            headers: {
                passkey: INTER_SERVER_PASSKEY,
                task,
                path,
                folder: isFolder
            }
        })
    );
};