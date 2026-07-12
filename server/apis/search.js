import { DbPath, Endpoints, CHAR_VALIDATION } from 'core/common_values.js';
import { guardObject, GuardSignal } from 'guard-object';
import { simplifyCaughtError } from 'simplify-error';
import ip_lookup from '../ip_lookup.js';
import importer from '../importer.js';

const { default: mserver, collection, ensureVerifiedAuth } = await importer('./mserver.js');

mserver.listenHttpsRequest(Endpoints.wordSuggestion, async (req, res, user) => {
    if (user) ensureVerifiedAuth(user);
    try {
        guardObject({ word: GuardSignal.STRING }).validate(req.body);

        const location = ip_lookup(req.headers);
        const search = req.body.word.toLowerCase();

        if (search) {
            const suggestions = await Promise.all([
                user ?
                    collection(DbPath.userSearchIndexer).find({
                        $text: { $search: search },
                        user: user.uid
                    }).sort('importance', 'desc').limit(7).toArray() : Promise.resolve([]),
                location ?
                    collection(DbPath.trendingGeoSearchIndexer).find({
                        $text: { $search: search },
                        country: location.country
                    }).sort('importance', 'desc').limit(7).toArray() : Promise.resolve([]),
                collection(DbPath.trendingSearchIndexer).find({
                    $text: { $search: search }
                }).sort('importance', 'desc').limit(7).toArray(),
                location ?
                    collection(DbPath.geoSearchIndexer).find({
                        $text: { $search: search },
                        country: location.country
                    }).sort('importance', 'desc').limit(7).toArray() : Promise.resolve([]),
                collection(DbPath.searchIndexer).find({
                    $text: { $search: search }
                }).sort('importance', 'desc').limit(7).toArray()
            ]);

            const suggestedSearch = [
                ...new Set([
                    ...suggestions.map(v => v[0]?.search).filter(v => v),
                    ...suggestions.flat().sort((a, b) => a.importance - b.importance).map(v => v.search).reverse()
                ])
            ];

            res.status(200).send({
                result: suggestedSearch.map(v => ({ name: v })).slice(0, CHAR_VALIDATION.SEARCH_SUGGESTION_LIMIT)
            });
        } else {
            const suggestions = await Promise.all([
                location ? collection(DbPath.trendingGeoSearchIndexer).find({
                    country: location.country
                }).sort('importance', 'desc').limit(7).toArray() : Promise.resolve([]),
                collection(DbPath.trendingSearchIndexer).find({}).sort('importance', 'desc').limit(7).toArray(),
                location ? collection(DbPath.geoSearchIndexer).find({
                    country: location.country
                }).sort('importance', 'desc').limit(7).toArray() : Promise.resolve([]),
                collection(DbPath.searchIndexer).find({}).sort('importance', 'desc').limit(7).toArray()
            ]);

            const suggestedSearch = [
                ...new Set([
                    ...suggestions[0].slice(0, 2).map(v => v.search),
                    ...suggestions.map(v => v[0]?.search).filter(v => v),
                    ...suggestions.flat().sort((a, b) => a.importance - b.importance).map(v => v.search).reverse()
                ])
            ];

            res.status(200).send({
                result: suggestedSearch.map(v => ({ name: v })).slice(0, CHAR_VALIDATION.SEARCH_SUGGESTION_LIMIT)
            });
        }
    } catch (e) {
        res.status(500).send(simplifyCaughtError(e));
    }
});