import { INTER_SERVER_PASSKEY } from "#/env";
import mserver from "../mserver";
import { COMMON_OBJECT_EXTRACTIONS, DbPath } from "core/common_values";

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

const AllowedIps = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

mserver.listenHttpsRequest('server_bridging', async (req, res) => {
    const { apiCommand, mserverCommand } = req.body;

    try {
        if (
            !AllowedIps.has(req.ip) ||
            req.hostname !== 'localhost' ||
            req.headers.password !== INTER_SERVER_PASSKEY
        ) {
            throw 'unauthorize server bridge access';
        }

        let data;
        if (apiCommand) {
            const { route, obj } = apiCommand;
            data = await globalThis.mosquitoApis[route](obj);
        } else if (mserverCommand) {
            const { executor, info } = mserverCommand;
            data = await new AsyncFunction('server', `return (${executor})(server)`)({
                mserver,
                collection: (...args) => mserver.db.collection(...args),
                info,
                DbPath,
                extractor: COMMON_OBJECT_EXTRACTIONS
            });
        }
        res.status(200).send({ data, success: true });
    } catch (error) {
        res.status(200).send({ data: `${error}`, success: false });
    }
});