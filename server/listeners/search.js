import { DbPath } from "core/common_values";
import { runDailyLoop } from "../loop";
import { one_day, one_week } from "../../common/timing.js";

const { default: mserver, collection } = await importer('./mserver.js');

mserver.listenDatabase(DbPath.searchHistory, async emittion => {
    const { insertion } = emittion;

    if (insertion) {
        const { search, user, country } = insertion;

        return collection(DbPath.userSearchIndexer).updateOne({ _id: `${user} ${search.toLowerCase()}` }, {
            $set: {
                user,
                search: search.toLowerCase(),
                updatedOn: Date.now()
            },
            $setOnInsert: {
                addedOn: Date.now(),
                country
            },
            $inc: { importance: 1 }
        }, { upsert: true });
    }
});

mserver.listenDatabase(DbPath.userSearchIndexer, async emittion => {
    const { insertion } = emittion;

    if (insertion) {
        const { search, country } = insertion;

        return Promise.all([
            collection(DbPath.trendingSearchIndexer).updateOne({ _id: search }, {
                $set: { updatedOn: Date.now() },
                $setOnInsert: { addedOn: Date.now(), search },
                $inc: { importance: 1 }
            }, { upsert: true }),
            country ? collection(DbPath.trendingGeoSearchIndexer).updateOne({ _id: `${country} ${search}` }, {
                $set: { updatedOn: Date.now() },
                $setOnInsert: { addedOn: Date.now(), search, country },
                $inc: { importance: 1 }
            }, { upsert: true }) : Promise.resolve(),
            collection(DbPath.searchIndexer).updateOne({ _id: search }, {
                $set: { updatedOn: Date.now() },
                $setOnInsert: { addedOn: Date.now(), search },
                $inc: { importance: 1 }
            }, { upsert: true }),
            country ? collection(DbPath.geoSearchIndexer).updateOne({ _id: `${country} ${search}` }, {
                $set: { updatedOn: Date.now() },
                $setOnInsert: { addedOn: Date.now(), search, country },
                $inc: { importance: 1 }
            }, { upsert: true }) : Promise.resolve()
        ]);
    }
});

const TRENDING_SEARCH_RATIO = 7000 / one_day;

const purgeTrendingSearch = () =>
    Promise.all([
        collection(DbPath.trendingSearchIndexer).find({ addedOn: { $gt: Date.now() - one_week } }).toArray().then(r =>
            Promise.all(r.filter(v =>
                (v.importance / (Date.now() - v.addedOn)) < TRENDING_SEARCH_RATIO
            ).map(async v =>
                collection(DbPath.trendingSearchIndexer).deleteOne({ _id: v._id })
            ))
        ),
        collection(DbPath.trendingGeoSearchIndexer).find({ addedOn: { $gt: Date.now() - one_week } }).toArray().then(r =>
            Promise.all(r.filter(v =>
                (v.importance / (Date.now() - v.addedOn)) < TRENDING_SEARCH_RATIO
            ).map(async v =>
                collection(DbPath.trendingGeoSearchIndexer).deleteOne({ _id: v._id })
            ))
        )
    ]);

runDailyLoop(purgeTrendingSearch);