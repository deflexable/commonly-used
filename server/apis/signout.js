import { Endpoints } from 'core/common_values.js';
import { simplifyCaughtError } from 'simplify-error';
import importer from '../importer';

const { default: mserver } = await importer('./mserver.js');

mserver.listenHttpsRequest(Endpoints.purgeUserJWTToken, async (_, res, user) => {
    try {
        await mserver.signOutUser(user.uid);
    } catch (e) {
        res.status(500).send(simplifyCaughtError(e));
    }
});