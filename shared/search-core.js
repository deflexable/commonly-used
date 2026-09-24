import { useEffect, useRef, useState } from "react";
import { randomString } from "../common/methods.js";

export const useSearchSuggestionCore = ({ mserver, GEO_JSON, TIMESTAMP, getAnalytics, logEvent }) =>
    (searchValue = '') => {
        searchValue = searchValue.trim();

        const [suggestions, setSuggestions] = useState([]);

        const currentSearch = useRef('');
        const hasMounted = useRef();
        const initialData = useRef({ isLoading: false, data: undefined })
        const loggedSearch = useRef({});

        useEffect(() => {
            if (hasMounted.current) {
                currentSearch.current = searchValue;
                loadSuggestions();
            }
            hasMounted.current = true;
        }, [searchValue]);

        const loadSuggestions = async () => {
            const userId = mserver.user?.uid;
            const search = currentSearch.current.trim();
            const { isLoading: initLoading, data: initData } = initialData.current;

            if (!search && (initLoading || initData)) {
                if (initData) setSuggestions(initData);
                return;
            }
            if (!search) initialData.current.isLoading = true;

            const [myList, recommended] =
                await Promise.all([
                    userId ?
                        mserver.collection('searchHistoryUnique')
                            .find({ user: userId })
                            .sort('date', 'desc')
                            .limit(5).get().then(r =>
                                r.map(v => ({ isHistory: true, name: v.search, _id: v._id }))
                            )
                        : Promise.resolve([]),
                    mserver.fetchHttp('wordSuggestion', {
                        body: { word: search || '' }
                    }, { enableMinimizer: true, retrieval: 'cache-await' }).then(async r => {
                        r = await r.json();
                        return r.result || [];
                    }).catch(() => [])
                ]);

            const data = [
                ...myList.slice(0, 3),
                ...recommended,
                ...myList.slice(3)
            ].filter((v, i, a) => a.findIndex(b => b.name === v.name) === i)
                .slice(0, 7);

            if (!search) initialData.current = { isLoading: false, data };
            if (search !== currentSearch.current.trim()) return;
            setSuggestions(data);
        }

        const logSearched = (geo) => {
            const userId = mserver.user?.uid;
            if (!userId || !searchValue || loggedSearch.current[searchValue.toLowerCase()]) return;
            loggedSearch.current[searchValue.toLowerCase()] = true;

            mserver.batchWrite([
                {
                    path: 'searchHistory',
                    scope: 'setOne',
                    value: {
                        search: searchValue,
                        user: userId,
                        _id: randomString(21),
                        date: TIMESTAMP,
                        ...geo?.ll ? {
                            location: GEO_JSON(...geo.ll),
                            country: geo.country,
                            city: geo.city
                        } : {}
                    }
                }, {
                    path: 'searchHistoryUnique',
                    scope: 'putOne',
                    find: { _id: `${userId} ${searchValue.toLowerCase()}` },
                    value: { user: userId, search: searchValue, date: TIMESTAMP }
                }
            ]);
            logEvent(getAnalytics(), 'view_search_results', { search_term: searchValue });
        }

        return {
            suggestions,
            setSuggestions: (list) => {
                if (!searchValue.trim()) initialData.current.data = list;
                setSuggestions(list);
            },
            loadSuggestion: (search = '') => {
                currentSearch.current = search;
                loadSuggestions();
            },
            logSearched
        };
    };