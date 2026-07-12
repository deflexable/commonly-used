import { DbPath, Endpoints, EMAIL_DOMAINS } from 'core/common_values.js';
import { guardObject, GuardSignal, Validator } from 'guard-object';
import LOCALE_STORE from '../locale_store.js';
import { simplifyCaughtError, simplifyError } from 'simplify-error';
import { randomString } from "../../common/methods.js";
import { one_hour } from "../../common/timing.js";
import { sendEmail } from '../mailer.js';
import importer from '../importer.js';

const { default: mserver, collection } = await importer('./mserver.js');
const { APP_NAME, IS_DEV, WEB_BASE_URL } = await importer('./env.js');

const VerificationPendingAction = {};

mserver.listenHttpsRequest(Endpoints.createVerificationEmail, async (req, res, user) => {
    try {
        if (!user) throw 'user is required';
        if (user.authVerified) throw simplifyError('already_verified', 'This email address has already been verified');

        guardObject({
            code: GuardSignal.TRIMMED_NON_EMPTY_STRING,
            lang: t => t === undefined || t === null || Validator.STRING(t)
        }).validate(req.body);
        const { code, lang = 'en' } = req.body;

        const token = `${user.uid}-${randomString(11)}`;

        await sendEmail({
            filepath: 'email_verification.html',
            prefillData: {
                displayName: (user.profile.name || '').split(' ')[0] || '',
                link: `${WEB_BASE_URL}/email_validation/${token}`
            },
            subject: LOCALE_STORE[lang].email_verification,
            from: EMAIL_DOMAINS.NO_REPLY,
            to: user.profile.email,
            lang
        });

        VerificationPendingAction[token] = [
            { user: user.uid, code, ip: req.cip },
            setTimeout(() => {
                delete VerificationPendingAction[token];
            }, one_hour)
        ];

        res.status(200).send({ status: 'sent' });
    } catch (e) {
        res.status(500).send(simplifyCaughtError(e));
        throw e;
    }
});

mserver.listenHttpsRequest(Endpoints.validateEmail, async (req, res) => {
    guardObject({
        token: GuardSignal.STRING,
        code: t => t === undefined || t === null || Validator.STRING(t)
    }).validate(req.body);

    const { token, code } = req.body;

    const codeObj = VerificationPendingAction[token];
    let expired,
        alreadyVerified,
        validated = false;

    if (codeObj) {
        if ((code && code === codeObj[0].code) || (!IS_DEV && req.cip && req.cip === codeObj[0].ip)) {
            clearTimeout(codeObj[1]);
            delete VerificationPendingAction[token];

            const uid = codeObj[0].user;
            const userData = await mserver.getUserData(uid);
            alreadyVerified = userData.passwordVerified;
            validated = true;

            if (!alreadyVerified) {
                const name = userData.profile?.name;
                const email = userData.email;

                await Promise.all([
                    mserver.updateUserPasswordVerified(uid, true),
                    (userData.google || userData.apple) ? Promise.resolve() :
                        collection(DbPath.prefferedSettings).findOne({ _id: uid }).then(async pref => {
                            const { filepath, prefillData } = await doWelcomeEmail(userData);

                            return sendEmail({
                                filepath,
                                prefillData: { displayName: name, ...prefillData },
                                subject: `${LOCALE_STORE[pref?.locale].welcome_to} ${APP_NAME}, ${(name || '').split(' ')[0] || ''}!`,
                                from: EMAIL_DOMAINS.NO_REPLY,
                                to: email,
                                lang: pref?.locale
                            });
                        })
                ]);
            }
        }
    } else {
        const userData = await mserver.getUserData(token.split('-')[0]);
        alreadyVerified = userData.passwordVerified;

        validated = alreadyVerified;
        expired = !alreadyVerified;
    }

    res.status(200).send({ validated, expired, alreadyVerified });
});

let doWelcomeEmail = async () => ({ filepath: 'welcome_email.html' });

export const configureWelcomeEmail = (func) => {
    doWelcomeEmail = func;
}