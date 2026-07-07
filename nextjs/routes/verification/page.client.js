"use client"

import { useEffect, useRef, useState } from "react";
import { deserializeStorage, internal_storage_keys, serializeStorage } from "../../cacher";
import { auth, fetchHttp } from "../../client_server";
import { useFancyDialog } from "../../components/ContainerModal/ContainerModals";
import { randomString } from "../../../common/methods";
import { Endpoints } from "core/common_values";
import { simplifyCaughtError } from "simplify-error";
import ClickableDiv from "../../components/ClickableDiv/ClickableDiv";

let thatCode;

export default function ({ email, entityOf, locale }) {
    const [isVerified, setVerified] = useState();
    const [isCreatingVerificationEmail, setCreatingVerificationEmail] = useState();
    const [resendEmailTimer, setResendEmailTimer] = useState(60);
    const [deviceCode, setDeviceCode] = useState();

    const timer = useRef();

    const { openFancyDialog } = useFancyDialog();

    const countdown = () => {
        setResendEmailTimer(60);
        let secs = 60;

        clearInterval(timer.current);
        timer.current = setInterval(() => {
            if (!--secs) clearInterval(timer.current);
            setResendEmailTimer(secs);
        }, 1000);
    }

    useEffect(() => {
        const verificationListener = auth().listenVerifiedStatus(verified => {
            console.log('onVerifed: ', verified);

            if (verified) {
                verificationListener();
                setVerified(verified);
                auth().forceRefreshToken();
            }
        });

        deserializeStorage(internal_storage_keys.AUTO_SEND_VERIFY).then(entity => {
            if (entity && entity === entityOf) {
                sendVerify();
                serializeStorage(internal_storage_keys.AUTO_SEND_VERIFY);
            } else countdown();
        });

        return () => {
            clearInterval(timer.current);
            verificationListener();
        };
    }, []);

    const disableButton = !!(isCreatingVerificationEmail || resendEmailTimer);

    const sendVerify = async () => {
        setCreatingVerificationEmail(true);

        try {
            const code = thatCode || (thatCode = randomString(4, true, false, false));
            const res = await (
                await fetchHttp(
                    Endpoints.createVerificationEmail,
                    { body: { code } },
                    { retrieval: 'no-cache-no-await' }
                )
            ).json();
            if (res.status !== 'sent') throw res;
            countdown();

            setDeviceCode(code);
            openFancyDialog({
                title: locale.email_sent,
                message: `${locale.email_sent_prefix} "${email}" ${locale.email_sent_suffix}`,
                img: '/assets/successful.png',
                yesTxt: locale.dismiss,
                hideNo: true
            });
        } catch (e) {
            setResendEmailTimer(0);
            console.error('resendEmail err:', e);
            const { error, message } = simplifyCaughtError(e).simpleError;

            openFancyDialog({
                title: locale[error] || error,
                message: locale[message] || message,
                img: '/assets/caution.png',
                yesTxt: locale.dismiss,
                hideNo: true
            });
        }

        setCreatingVerificationEmail(false);
    };

    return (
        <div className="con-verification-x thickBG">
            <div className="cont-verification-x">
                <img src={isVerified ? '/assets/approved.png' : '/assets/email-sent.png'} />
                <div className="title-verification-x">
                    {locale[isVerified ? 'verification_successful' : 'verify_your_email']}
                </div>
                {isVerified ? null :
                    <div className="des-verification-x">
                        {locale.sent_email_prefix} <b>{email || ''}</b>, {locale.sent_email_suffix}
                    </div>}

                {(deviceCode || isVerified) ?
                    <div className="device-code-des"
                        style={isVerified ? { color: 'gray', fontStyle: 'italic' } : undefined}>
                        {isVerified ? `${locale.redirecting}...` : `${locale.your_device_code_is} ${deviceCode}`}
                    </div> : null}

                {isVerified ? null :
                    <button
                        disabled={disableButton}
                        className={`rcolor${disableButton ? '' : " button-behaviour"}`}
                        style={disableButton ? { opacity: '0.5' } : undefined}
                        onClick={sendVerify}>
                        {isCreatingVerificationEmail ? `${locale.sending_email}..` : resendEmailTimer ? `${locale.resend_email} ${resendEmailTimer}s` : locale.Resend_Email}
                    </button>}

                {isVerified ? null :
                    <ClickableDiv
                        className="logout-homepage-btn button-behaviour"
                        onClick={() => {
                            auth().signOut();
                        }}>
                        {locale.logout_goto_homepage}
                    </ClickableDiv>}
            </div>
        </div>
    );
}