import { Endpoints } from 'core/common_values.js';
import { simplifyCaughtError } from 'simplify-error';

const { default: mserver, ensureVerifiedAuth } = await importer('./mserver.js');

mserver.listenHttpsRequest(Endpoints.purgeUserJWTToken, async (_, res, user) => {
    ensureVerifiedAuth(user);
    try {
        await mserver.signOutUser(user.uid);
    } catch (e) {
        res.status(500).send(simplifyCaughtError(e));
    }
});