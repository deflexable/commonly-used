"use client"

import { useEffect, useRef, useState } from 'react';
import langy from '../../langy';
import { useDarkMode } from '../../theme_helper';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Link from '../../config/next-link';
import { useFancyDialog } from '../../components/ContainerModal/ContainerModals';
import { fetchHttp, useIsOnline } from '../../client_server';
import { Endpoints, SUPPORT_HCAPTCHA_LANGS } from 'core/common_values.js';
import { Validator } from 'guard-object';
import { simplifyCaughtError, simplifyError } from 'simplify-error';
import { getAnalytics, logEvent } from 'firebase/analytics';
import firebase_app from '../../firebase_app';

export default function ({ theme_config, lang, params, routerSearch, locale }) {
    const isDarkMode = useDarkMode(theme_config);

    const [isPageLoading, setPageLoading] = useState(),
        [isEmailValid, setEmailValid] = useState();

    const botDetector = useRef(),
        captchaToken = useRef(),
        hasMountedResetCaptcha = useRef();

    const { openFancyDialog } = useFancyDialog();

    const isOnline = useIsOnline();

    const isFormValid = typeof isEmailValid !== 'boolean' || isEmailValid,
        isBtnDisabled = !!isPageLoading || !isFormValid;

    useEffect(() => {
        if (typeof isOnline !== 'boolean') return;
        if (isOnline && hasMountedResetCaptcha.current)
            botDetector.current.resetCaptcha();

        hasMountedResetCaptcha.current = true;
    }, [isOnline]);

    const checkValidForm = (t = '') => Validator.EMAIL(t.trim());

    const resetPassword = async () => {
        if (isBtnDisabled) return;
        const email = document.querySelector('#email-auth-input').value;

        if (!checkValidForm(email)) {
            setEmailValid(false);
            return;
        }
        setPageLoading(true);

        try {
            if (!captchaToken.current)
                if (!(captchaToken.current = await botDetector.current.execute({ async: true }))) {
                    botDetector.current.resetCaptcha();
                    throw simplifyError('recaptcha_failed', 'recaptcha_failed_des');
                }

            const redirect = decodeURIComponent(new URL(location.href).searchParams.get('redirect') || '');

            const r = await (
                await fetchHttp(
                    Endpoints.resetPassword,
                    {
                        headers: { 'content-type': 'application/json' },
                        method: 'POST',
                        body: JSON.stringify({
                            email,
                            ...redirect ? { redirect } : {},
                            captcha: captchaToken.current.response,
                            lang
                        })
                    },
                    {
                        disableAuth: true,
                        retrieval: 'no-cache-no-await'
                    }
                )
            ).json();
            if (r.simpleError) throw r;

            logEvent(getAnalytics(firebase_app), 'send_password_reset', {
                value: email
            });

            openFancyDialog({
                img: '/assets/successful.png',
                message: `${locale.sent_email_prefix} "${email}" ${locale.sent_email_suffix}`,
                yesTxt: locale.dismiss,
                hideNo: true
            });
            document.querySelector('#email-auth-input').value = '';
        } catch (e) {
            if (captchaToken.current) {
                const { error, message } = simplifyCaughtError(e).simpleError;

                openFancyDialog({
                    title: locale[error] || error,
                    message: locale[message] || message,
                    img: '/assets/caution.png',
                    yesTxt: locale.dismiss,
                    hideNo: true
                });
            }
        }
        setPageLoading(false);
    }

    return (
        <div className="con-auth-screen">
            <div className='page-stretcher-auth-screen'>

                <div id='page-stretcher-auth-screen-float-bg invertion' />

                <div className='thickBG cont-pack-auth-screen'>

                    <div className="cont-auth-screen">

                        <div className='header-auth-screen'>
                            <Link href={langy('/', params)}>
                                <img src={'/assets/logo.png'} alt={`${process.env.NEXT_PUBLIC_APP_NAME} Logo`} />
                            </Link>
                            <h1>
                                {locale.reset_password_for_email}
                            </h1>
                        </div>

                        <form
                            className='auth-form-auth-screen'
                            onSubmit={e => {
                                e.preventDefault();
                                resetPassword();
                            }}>
                            <div
                                style={isFormValid ? undefined : {
                                    backgroundColor: 'var(--good-red-blur)',
                                    border: '1px solid var(--good-red-blur)'
                                }}>
                                <input
                                    type={'email'}
                                    required
                                    placeholder={locale.enter_your_email}
                                    id='email-auth-input'
                                    disabled={isPageLoading}
                                    onChange={e => {
                                        if (typeof isEmailValid === 'boolean')
                                            setEmailValid(checkValidForm(e.currentTarget.value.trim()));
                                    }} />
                            </div>
                            {isFormValid ? null :
                                <small style={{
                                    display: 'block',
                                    color: 'var(--good-red)',
                                    textAlign: 'center',
                                    margin: '10px 10px 0px 10px'
                                }}>
                                    {locale.please_enter_email}
                                </small>}
                        </form>

                        <div className='agreement-con-auth-screen'>
                            <span style={{ textAlign: 'center' }}>
                                {locale.link_for_resetting_will_sent_email}
                            </span>
                        </div>

                        <button
                            style={{
                                marginTop: 35,
                                opacity: isFormValid ? 1 : 0.4
                            }}
                            disabled={isBtnDisabled}
                            className={`auth-btn-auth-screen rcolor${isBtnDisabled ? '' : ' button-behaviour'}`}
                            onClick={resetPassword}>
                            {locale.reset_password}
                            {isPageLoading ? <img src='/assets/loading.gif' className='rinvertion' /> : null}
                        </button>

                        <HCaptcha
                            ref={botDetector}
                            size="invisible"
                            theme={isDarkMode ? 'dark' : 'light'}
                            languageOverride={SUPPORT_HCAPTCHA_LANGS[lang] ? lang : 'en'}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                            onExpire={() => {
                                captchaToken.current = undefined;
                            }}
                        />

                        <Link
                            href={langy(`/auth${routerSearch || ''}`)}
                            style={{
                                color: 'var(--dblue)',
                                margin: '20px 10px',
                                display: 'block',
                                textAlign: 'center',
                                textDecoration: 'none'
                            }}>
                            {locale.login_instead}
                        </Link>
                    </div>
                </div>

                {isPageLoading ?
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        zIndex: 1,
                        top: 0,
                        cursor: 'progress'
                    }} /> : null}
            </div>
        </div>
    );
}