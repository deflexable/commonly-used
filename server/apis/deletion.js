import { DbPath, Endpoints, EMAIL_DOMAINS } from 'core/common_values.js';
import { guardObject, GuardSignal } from 'guard-object';
import LOCALE_STORE from '../locale_store';
import { simplifyError } from 'simplify-error';
import { joinPath, randomString } from "../../common/methods.js";
import { one_minute } from "../../common/timing.js";
import { sendEmail } from '../mailer.js';

const { default: mserver, collection, ensureVerifiedAuth } = await importer('./mserver.js');
const { APP_NAME, API_BASE_URL } = await importer('./env.js');

const PendingDeletionAction = {};

mserver.listenHttpsRequest(Endpoints.initiateAccountDeletion, async (req, res, user) => {
    ensureVerifiedAuth(user);
    const code = randomString(6, true, false, false);

    if (PendingDeletionAction[user.uid]) {
        clearTimeout(PendingDeletionAction[user.uid][1]);
        delete PendingDeletionAction[user.uid];
    }

    await collection(DbPath.prefferedSettings).findOne({ _id: user.uid }).then(config =>
        sendEmail({
            filepath: 'deletion_confirm.html',
            prefillData: {
                displayName: (user.profile?.name || '').split(' ')[0],
                confirmationCode: code
            },
            subject: `${LOCALE_STORE[config?.locale].deletion_confirm_title} - ${APP_NAME}`,
            from: EMAIL_DOMAINS.NO_REPLY,
            to: user.email,
            lang: config?.locale
        })
    );

    PendingDeletionAction[user.uid] = [
        code,
        setTimeout(() => {
            delete PendingDeletionAction[user.uid];
        }, one_minute * 10)
    ];

    res.status(200).send({ success: true });
});

const PopedImageReplacement = joinPath(API_BASE_URL, '/assets/unfollow.png');

mserver.listenHttpsRequest(Endpoints.deleteAccount, async (req, res, user) => {
    ensureVerifiedAuth(user);
    guardObject({ code: GuardSignal.TRIMMED_NON_EMPTY_STRING }).validate(req.body);
    const userId = user.uid;
    const { code } = req.body;

    const codeObj = PendingDeletionAction[userId];
    if (codeObj && code === codeObj[0]) {
        clearTimeout(codeObj[1]);
        delete PendingDeletionAction[userId];

        const adminDb = mserver.admin_db;
        const StubEmail = randomString(20).concat(EMAIL_DOMAINS.DELETION_SUFFIX);

        await Promise.all([
            adminDb.collection('userAcct').updateOne({ _id: userId }, {
                $unset: { google: true, apple: true }
            }),
            mserver.updateUserEmailAddress(userId, StubEmail),
            collection(DbPath.users).updateOne({ _id: userId }, {
                $set: {
                    email: StubEmail,
                    name: 'Deleted Account',
                    deleted: true,
                    archived: true,
                    at: `${randomString(11)}_deleted`,
                    photo: PopedImageReplacement
                }
            }),
            collection(DbPath.notificationToken).deleteMany({ user: userId }),
            collection(DbPath.deletedAccount).insertOne({
                _id: randomString(30),
                user: userId,
                lastToken: `${user}`,
                date: Date.now()
            }),
            collection(DbPath.deletedAccountCount).updateOne({ _id: user.email }, {
                $inc: { value: 1 }
            }, { upsert: true }),
            accountDeletionTask(user)
        ]);

        res.status(200).send({ success: true });

        mserver.signOutUser(userId);
    } else {
        res.status(200).send({
            error: simplifyError('Invalid Code', 'The provided confirmation code is incorrect, Please try again')
        });
    }
});

let accountDeletionTask = async () => null;

export const configureAccountDeletion = (func) => {
    accountDeletionTask = func;
}