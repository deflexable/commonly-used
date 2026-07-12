import '../logger.js';
import MosquitoTransportServer from 'mosquito-transport';
import { DbPath, Endpoints, MICRO_SERVICES, StoragePath, SERVICE_TASKS } from 'core/common_values';
import textToImage from 'text-to-image';
import { purifyBase64, storageDesinationToLink } from '../peripherals';
import { timeoutFetch } from "../fetcher";
import monitor_health from '../monitor_health.js';

const { API_BASE_URL, INTER_SERVER_PASSKEY } = await importer('../env.js');
const { default: storage_rules } = await importer('../storage_rules');
const { default: COMMON_MSERVER_CONFIG } = await importer('../common_service');

const mserver = new MosquitoTransportServer({
    ...COMMON_MSERVER_CONFIG(MICRO_SERVICES.AVATARS),
    storageRules: s => storage_rules(s, mserver, MICRO_SERVICES.AVATARS)
});

const collection = mserver.getDatabase().collection;
monitor_health(collection);

mserver.listenHttpsRequest(Endpoints.storeAvatar, async (req, res) => {
    const { passkey, photo, name, uid, task_id } = req.headers;

    if (passkey !== INTER_SERVER_PASSKEY) {
        res.sendStatus(403);
        return;
    }

    res.sendStatus(200);
    await storeAvatar(uid, name, photo, task_id);
}, {
    rawEntry: true
});

const storeAvatar = async (uid, name, photo, taskID) => {
    try {
        let buffer;

        if (photo) {
            const res = await timeoutFetch(extractClearImage(photo));
            buffer = Buffer.from(await res.arrayBuffer());
        } else {
            buffer = purifyBase64(await generateUserImage(name));
        }

        await mserver.writeFile(StoragePath.userProfile(uid), buffer);
    } catch (e) {
        console.error('storeAvatar imgBuf err:', e);
    }

    await mserver.updateUserProfile(uid, {
        photo: storageDesinationToLink(StoragePath.userMiniPhoto(uid), API_BASE_URL)
    });
    await collection(DbPath.microserversTasks).deleteOne({ _id: taskID });
};

collection(DbPath.microserversTasks).find({
    domain: API_BASE_URL,
    task: SERVICE_TASKS.initAvatar
}).toArray().then(r =>
    Promise.all(r.map(async ({ _id, data }) =>
        storeAvatar(data.uid, data.name, data.photo, _id)
    ))
).then(r => {
    console.log(`resumed ${r.length} avatars residue`);
});

const extractClearImage = (img = '') => img.includes('googleusercontent.com/') ? img.split('=s96-c').join('=s700-c') : img;

const colors = ['rgb(145,181,251)', 'orange', 'red', 'green', 'blue', 'violet', 'purple', 'indianred', 'rgb(130, 0, 100)', 'palevioletred', 'peru', 'brown', 'cadetblue', 'crimson', 'darkslategrey', 'royalblue', 'rosybrown', 'slateblue', 'seagreen', 'steelblue'];

const generateUserImage = async (name) => {
    const dataUri = await textToImage.generate((name || 'A').toUpperCase()[0], {
        maxWidth: 500,
        customHeight: 500,
        textAlign: 'center',
        verticalAlign: 'center',
        fontSize: 350,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        margin: 1,
        bgColor: colors[Math.floor(Math.random() * colors.length)],
        textColor: 'white'
    });

    return dataUri;
};

console.log(`This app instance is attached to pid=${process.pid}`);
console.log('Kindly visit ', API_BASE_URL);