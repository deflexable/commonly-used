import { DbPath, versionStake } from "core/common_values";

const { default: mserver, collection } = await importer('./mserver.js');

const versionStake = t => t.split('.').map(v => v * 1).join('') * 1;

mserver.listenDatabase(DbPath.VERSION_CONTROL, async emittion => {
    const { insertion, deletion, documentKey } = emittion;

    if (insertion || deletion) {
        const [platform] = documentKey.split(' ');

        const versionControl = await collection(DbPath.VERSION_CONTROL).find({ platform }).toArray();
        const highest = versionControl
            .map(v => ({ ...v, stake: versionStake(v.version) }))
            .sort((a, b) => a.stake - b.stake).slice(-1)[0];

        if (highest) {
            const versionListing = await collection(DbPath.VERSION_CONTROL).find({ platform }).toArray();

            await Promise.all(versionListing.map(v =>
                v._id === documentKey ? null :
                    collection(DbPath.VERSION_CONTROL).updateOne({ _id: v._id }, {
                        $set: { upgradable: highest.version }
                    })
            ));
        }
    }
});