import { randomString, wait } from "../common/methods";
import { runDailyLoop } from "./loop";

export class IndexNow {
    constructor({ collection, env: { key, origin_url } }) {
        this.engine = getEngine({ collection, key, origin_url });
    }

    push(url) {
        return this.engine.push(url);
    }
}

const getEngine = ({ collection, key, origin_url }) => {
    const MAX_SUBMISSION = 9000;

    let submissions = 0;
    let failures = 0;

    const stub_arr = [];
    let stub_timer;

    /**
     * freely call push to submit url to indexNow
     */
    const push = (url) => {
        const dispatch = () =>
            submitIndex(new Set([...stub_arr.splice(0, stub_arr.length)]));

        clearTimeout(stub_timer);
        if (stub_arr.push(url) >= 1000) {
            dispatch();
        } else {
            stub_timer = setTimeout(dispatch, 1000);
        }
    }

    let prevProcess;

    const submitIndex = async (url_list = [], retry_data) => {
        const thisProcess = doIndex(url_list, retry_data);
        prevProcess = thisProcess.finally(() => {
            if (thisProcess === prevProcess) prevProcess = undefined;
        });

        return thisProcess;
    }

    const doIndex = async (url_list = [], retry_data) => {
        if (retry_data) url_list = retry_data.url_list;

        const session_id = retry_data?._id || randomString(21);

        try {
            if (prevProcess !== undefined) await prevProcess;
            if (!retry_data)
                await collection('indexNowFailures').insertOne({
                    _id: session_id,
                    url_list,
                    failure: 0,
                    startedOn: Date.now()
                }).catch(() => null);

            if (submissions > MAX_SUBMISSION) return { soft_error: 'submission threshold exceeded' };
            if (failures > 3) return { soft_error: 'failure threshold exceeded' };

            const response = await fetch('https://api.indexnow.org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                    host: new URL(origin_url).hostname,
                    key,
                    keyLocation: origin_url.concat('/' + key + '.txt'),
                    urlList: url_list
                })
            });
            const message = await response.text();
            if (response.status !== 200) throw message;

            submissions += url_list.length;
            collection('indexNowStatus').insertOne({
                _id: randomString(21),
                url_list,
                date: `${new Date()}`,
                time: Date.now()
            });
            collection('indexNowFailures').deleteOne({ _id: session_id });
            await wait(60_000);
        } catch (error) {
            ++failures;

            if (retry_data && retry_data.failure >= 3) {
                collection('indexNowJunkYard').insertOne(retry_data);
                collection('indexNowFailures').deleteOne({ _id: session_id });
            } else {
                await collection('indexNowFailures').updateOne({ _id: session_id }, {
                    $inc: { failure: 1 },
                    $set: {
                        ...retry_data ? { retried_on: Date.now() } : {},
                        lastError: `${error}`
                    }
                }).catch(() => null);
            }

            return { error };
        }
    }

    runDailyLoop(() => {
        submissions = 0;
        failures = 0;
        collection('indexNowFailures').find({}).toArray().then(r =>
            Promise.all(
                r.map(v =>
                    submitIndex(undefined, v)
                )
            )
        );
    });

    return { push };
}