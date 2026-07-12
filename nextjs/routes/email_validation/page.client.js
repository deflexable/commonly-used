"use client"

import { useEffect, useState } from "react";
import { LoadingSpinner } from "../../components/TemplateItem/TemplateItem";
import { fetchHttp } from "../../client_server";
import { Endpoints } from "core/common_values";
import { getAnalytics, logEvent } from "firebase/analytics";
import firebase_app from "../../firebase_app";
import Link from "../../config/next-link";

export default function ({ page_data: { token, initResult }, locale, supportLink }) {
    const [result, setResult] = useState();
    const [showDeviceCode, setShowDeviceCode] = useState();
    const [isFormValid, setFormValid] = useState(true);

    const makeResultData = ({
        validated,
        expired,
        alreadyVerified
    }) => {
        setResult({
            message:
                alreadyVerified ? 'email_already_verified'
                    : expired ? 'expire_des'
                        : validated ? ['verification_success', ' 3s']
                            : 'invalid_code',
            validated,
            expired
        });
        if (validated) {
            setTimeout(() => {
                window.close();
                setTimeout(() => {
                    location.href = '/';
                }, 2000);
            }, 3000);
            window?.ReactNativeWebView?.postMessage?.('__close:this:webpage');
        }
    }

    useEffect(() => {
        if (initResult?.validated || initResult?.expired) {
            makeResultData(initResult);
            return;
        }
        setShowDeviceCode(true);
    }, []);

    const verifyRequestCode = async () => {
        setShowDeviceCode(false);
        const code = document.querySelector('#password-auth-input').value;

        try {
            const res = await (
                await fetchHttp(Endpoints.validateEmail, {
                    body: { token, code }
                }, { disableAuth: true, retrieval: 'no-cache-await' })
            ).json();

            if (!res.expired && !res.validated) {
                setFormValid(false);
                setShowDeviceCode(true);
                return;
            }

            logEvent(getAnalytics(firebase_app), 'verify_email', {
                value: res.validated ? 'success' : 'failed'
            });

            makeResultData(res);
        } catch (e) {
            console.error('validation Error: ', e);
            setResult({ validated: false, message: `${e}` });
        }
    }

    if (showDeviceCode)
        return (
            <div className="con-auth-screen">
                <div className='page-stretcher-auth-screen'>

                    <div id='page-stretcher-auth-screen-float-bg invertion' />

                    <div className='thickBG cont-pack-auth-screen'>

                        <div className="cont-auth-screen">
                            <div className='header-auth-screen'>
                                <Link href={'/'}>
                                    <img src={'/assets/logo.png'} />
                                </Link>
                                <div>
                                    {locale.verify_email_ownership}
                                </div>
                            </div>

                            <form
                                className='auth-form-auth-screen'
                                onSubmit={e => {
                                    e.preventDefault();
                                    verifyRequestCode();
                                }}>
                                <div
                                    style={isFormValid ? undefined : {
                                        backgroundColor: 'var(--good-red-blur)',
                                        border: '1px solid var(--good-red-blur)'
                                    }}>
                                    <input
                                        type={'number'}
                                        required
                                        placeholder={locale.enter_request_code}
                                        id='password-auth-input'
                                        onChange={e => {
                                            setFormValid(!!e.currentTarget.value.trim());
                                        }} />
                                </div>
                                {isFormValid ? null :
                                    <small style={{
                                        display: 'block',
                                        color: 'var(--good-red)',
                                        textAlign: 'center',
                                        margin: '10px 10px 0px 10px'
                                    }}>
                                        {locale.invalid_code}
                                    </small>}
                            </form>

                            <div className='agreement-con-auth-screen'>
                                <span style={{ textAlign: 'center' }}>
                                    {locale.provide_request_code_des}
                                </span>
                            </div>

                            <button
                                style={{
                                    marginTop: 35,
                                    opacity: isFormValid ? 1 : 0.4
                                }}
                                disabled={!isFormValid}
                                className={`auth-btn-auth-screen rcolor${isFormValid ? ' button-behaviour' : ''}`}
                                onClick={verifyRequestCode}>
                                {locale.verify_email}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );

    if (!result) return <LoadingSpinner style={{ height: '100vh' }} />;

    const { message, expired, validated } = result;

    return (
        <div className="con-email-v">
            <div className="cont-email-v">
                <img src={expired ? '/assets/expired.png' : validated ? '/assets/approved.png' : '/assets/cancel.png'} />
                <div>
                    {(Array.isArray(message) ? message : [message]).map(t => locale[t] || t).join('')}

                    {(expired || validated) ? null :
                        <>
                            {locale.contact_support_prefix}
                            <a href={supportLink || '/support'}>
                                {locale.support_team}
                            </a>
                        </>}
                </div>
            </div>
        </div>
    );
}