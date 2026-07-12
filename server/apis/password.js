import { verifyCaptcha, verifyDeviceIntegrity } from '../integrity.js';
import { DbPath, Endpoints, downScaleImage, EMAIL_DOMAINS } from 'core/common_values.js';
import { guardObject, GuardSignal, Validator } from 'guard-object';
import LOCALE_STORE from '../locale_store.js';
import { simplifyCaughtError, simplifyError } from 'simplify-error';
import { randomString } from "../../common/methods.js";
import { one_hour } from "../../common/timing.js";
import importer from '../importer.js';
import { sendEmail } from '../mailer.js';

const { default: mserver, collection } = await importer('./mserver.js');
const { APP_NAME, IS_DEV, WEB_BASE_URL } = await importer('./env.js');

const PendingPasswordResetAction = (globalThis.__pwdResetActionMapData = {});

mserver.listenHttpsRequest(Endpoints.resetPassword, async (req, res) => {
    try {
        guardObject({
            email: GuardSignal.EMAIL,
            captcha: (a, p) => Validator.TRIMMED_NON_EMPTY_STRING(a)
                || (a === undefined && p.integrity),
            integrity: (a, p) => Validator.TRIMMED_NON_EMPTY_STRING(a)
                || (a === undefined && p.captcha),
            lang: a => typeof a === 'string' || a === undefined,
            redirect: a => typeof a === 'string' || !a
        }).validate(req.body);

        const { email, redirect, lang, captcha, integrity } = req.body;
        const { _id: uid, name, at, photo, suspended } = (await collection(DbPath.users).findOne({ email })) || {};

        if (!uid)
            throw simplifyError(
                'user_not_found',
                'user_not_found_des'
            );

        if (suspended)
            throw simplifyError('suspended_account', 'suspended_account_des');

        if (captcha) {
            await verifyCaptcha(captcha);
        } else await verifyDeviceIntegrity(integrity);

        const userPref = await collection(DbPath.prefferedSettings).findOne({ _id: uid });
        const token = `${uid}-${randomString(30)}`;

        await sendEmail({
            filepath: 'reset_password.html',
            prefillData: {
                displayName: name,
                at,
                photo: downScaleImage(photo, 150),
                atLink: `${WEB_BASE_URL}/@${at || ''}`,
                resetLink: `${WEB_BASE_URL}/override_password/${token}`
            },
            subject: `${LOCALE_STORE[lang || userPref?.locale].reset_password} - ${APP_NAME}`,
            from: EMAIL_DOMAINS.NO_REPLY,
            to: email,
            lang: lang || userPref?.locale
        });

        PendingPasswordResetAction[token] = [
            { user: uid, redirect },
            setTimeout(() => {
                delete PendingPasswordResetAction[token];
            }, one_hour)
        ];

        res.status(200).send({ status: 'sent' });
    } catch (e) {
        res.status(500).send({
            status: 'error',
            ...simplifyCaughtError(e)
        });
        if (IS_DEV) throw e;
    }
});

mserver.listenHttpsRequest(Endpoints.updatePassword, async (req, res) => {
    const { token, newPassword, action } = req.body;
    try {
        guardObject({
            token: GuardSignal.STRING,
            newPassword: GuardSignal.STRING,
            action: GuardSignal.STRING
        }).validate(req.body);

        if (action === 'reset') {
            const { user: uid, used } = PendingPasswordResetAction[token]?.[0] || {};
            if (!uid || used) throw simplifyError('action_not_found', 'This link has either been deleted or doesn\'t exist on our database');
            PendingPasswordResetAction[token][0].used = true;

            await mserver.updateUserPassword(uid, newPassword);
            await mserver.updateUserPasswordVerified(uid, true);
        } else throw simplifyError('unknown_action_provided', 'The action provided to the request is invalid');
        res.status(200).send({ status: 'done' });
    } catch (e) {
        res.status(500).send({
            status: 'error',
            ...simplifyCaughtError(e)
        });
    }
});