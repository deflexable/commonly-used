import { DbPath } from "core/common_values.js";
import { randomString } from "../../common/methods";
import { timeoutFetch } from "../fetcher";
import importer from "../importer";

const { collection } = await importer('./mserver.js');
const { AVATAR_BASE_URL, INTER_SERVER_PASSKEY } = await importer('./env.js');

export default function init_avatar({ photo, name, uid }) {
    const taskId = randomString(30);

    collection(DbPath.microserversTasks).insertOne({
        _id: taskId,
        domain: AVATAR_BASE_URL,
        task: 'initAvatar',
        data: { photo, name, uid }
    }).finally(() =>
        timeoutFetch(AVATAR_BASE_URL.concat('/storeAvatar'), {
            headers: {
                passkey: INTER_SERVER_PASSKEY,
                ...photo ? { photo } : {},
                name,
                uid,
                task_id: taskId
            }
        })
    );
}