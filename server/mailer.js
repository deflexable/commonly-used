import { join, resolve } from 'path';
import { renderFile } from 'ejs';
import importer from './importer';
import { APPSTORE_URL, EMAIL_DOMAINS, PLAYSTORE_URL } from 'core/common_values';
import LOCALE_STORE from './locale_store';
import { createTransport } from 'nodemailer';

const { APP_NAME, COMPANY_HQ, COMPANY_NAME, IS_DEV, MAIL_CREDENTIALS, MAIL_HOST, WEB_BASE_URL } = await importer('./env');

const TEMPLATE_DIR = resolve(process.cwd(), './email_templates');
const PLAYSTORE_ICON = API_BASE_URL.concat('/assets/images/get_playstore.png');
const APPSTORE_ICON = API_BASE_URL.concat('/assets/images/get_applestore.png');

const transporter = Object.fromEntries(
    MAIL_CREDENTIALS.split(' ').map(v => {
        const [email, pass] = v.split('=');

        return [
            email,
            createTransport({
                host: MAIL_HOST,
                port: 465,
                secure: true,
                auth: { user: email, pass },
                tls: {
                    // rejectUnauthorized: false // optional, see notes below
                }
            })
        ];
    })
);

Object.entries(transporter).forEach(([email, d]) => {
    d.verify((err, succes) => {
        if (err || !succes) {
            console.error('email transporter for', email, ' returned error:', err);
        } else console.log('transporter for ', email, ' connected successfully');
    });
});

let extraConfigData;

export const setConfigData = (extras) => {
    extraConfigData = extras;
}

export const sendEmail = async ({
    filepath,
    html,
    text,
    prefillData,
    subject,
    to,
    from,
    lang,
    extras: { bcc, cc, replyTo, inReplyTo, attachments } = {}
}) => {
    if (`${from}`.endsWith(EMAIL_DOMAINS.DELETION_SUFFIX)) return;

    from = from || EMAIL_DOMAINS.NO_REPLY;

    const hydrationData = {
        ...extraConfigData,
        ...prefillData,
        _locale: LOCALE_STORE[lang] || {},
        _metadata: {
            appName: APP_NAME,
            supportLink: 'mailto:'.concat(EMAIL_DOMAINS.SUPPORT),
            supportLinkText: EMAIL_DOMAINS.SUPPORT,
            companyName: COMPANY_NAME,
            companyHQ: COMPANY_HQ,
            webBaseUrl: WEB_BASE_URL,
            playstoreLink: PLAYSTORE_URL,
            applestoreLink: APPSTORE_URL,
            playstoreImg: PLAYSTORE_ICON,
            applestoreImg: APPSTORE_ICON
        }
    };

    try {
        const htmlData =
            typeof filepath === 'string'
                ? await renderFile(join(TEMPLATE_DIR, filepath), hydrationData)
                : html;
        const content = htmlData ? { html: htmlData } : text ? { text } : undefined;

        if (!content) throw 'no email content provided';

        if (IS_DEV) console.log('email rendering success');

        const info = await transporter[from].sendMail({
            from: { address: from, name: APP_NAME },
            to,
            subject,
            ...content,
            ...(from.includes('noreply') && !replyTo) ? {} : { replyTo: { name: APP_NAME, address: replyTo || from } },
            attachments,
            bcc,
            cc,
            inReplyTo
        });

        return info;
    } catch (e) {
        console.error('sendEmail failed: ', e);
        if (IS_DEV) throw e;
        return e;
    }
};