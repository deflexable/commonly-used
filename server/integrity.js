import { simplifyError } from 'simplify-error';
import { timeoutFetch } from './fetcher';
import { IS_DEV, WEB_HOST_NAME, HCAPTCH_SECRET } from "core/env.js";

export const verifyCaptcha = async (token) => {
    if (IS_DEV) console.log('verifying captcha:', token);
    const captchaValidation = await (
        await timeoutFetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: HCAPTCH_SECRET,
                response: token
            })
        })
    ).json();
    const errorCodes = captchaValidation['error-codes'];

    if (IS_DEV) {
        console.error('verifyCaptcha: ', captchaValidation);
    } else if (captchaValidation.hostname !== WEB_HOST_NAME) {
        throw 'unexpected captcha hostname';
    }

    if (
        !captchaValidation.success &&
        !(errorCodes?.length === 1 && errorCodes[0] === 'already-seen-response')
    ) throw `${errorCodes}`;
};

export const verifyDeviceIntegrity = async (token, IS_DEV) => {
    if (IS_DEV) console.log('verifying device integrity:', token);
    try {
        // TODO: fix this also
        if (token !== 'yes') throw 'invalid integrity';
    } catch (e) {
        throw simplifyError('attestment_error', `${e}`);
    }
};