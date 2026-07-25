import { DbPath } from 'core/common_values';
import importer from '../importer';

const { API_BASE_URL, INTER_SERVER_PASSKEY } = await importer('../env.js', './env.js');

export default function init_remote_fs_deletion(mserver) {
    mserver.listenHttpsRequest('deleteMedia', async (req, res) => {
        const { passkey, task, path, folder } = req.headers;

        if (passkey !== INTER_SERVER_PASSKEY) {
            res.sendStatus(403);
            return;
        }

        await popFS(path, folder, task);

        res.sendStatus(200);
    }, {
        rawEntry: true
    });

    const popFS = async (path, folder, task) => {
        if (folder === 'yes') {
            await mserver.deleteFolder(path).catch(e => {
                console.error('deleteFolder err:', e);
            });
        } else if (folder === 'no') {
            await mserver.deleteFile(path).catch(e => {
                console.error('deleteFile err:', e);
            });
        }
        await mserver.db.collection(DbPath.microserversTasks).deleteOne({ _id: task });
    }

    mserver.db.collection(DbPath.microserversTasks).find({
        domain: API_BASE_URL,
        task: 'deleteMedia'
    }).toArray().then(r =>
        Promise.all(
            r.map(async ({ _id, data }) =>
                popFS(data.path, data.folder, _id)
            )
        )
    ).then(r => {
        console.log(`resumed ${r.length} media fs deletion`);
    });
}