"use client"

import { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import langy from '../../langy';
import Link from '../../config/next-link';
import { useDarkMode } from '../../theme_helper';
import { appendScriptSrc } from '../../methods.client';
import { auth, useIsOnline } from '../../client_server';
import { useFancyDialog } from '../../components/ContainerModal/ContainerModals';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { CONFIG_STATE } from '../../config/state';
import { AUTH_PROVIDER_ID } from 'mosquito-transport-js';
import { deserializeStorage, internal_storage_keys, serializeStorage } from '../../cacher';
import { FIELD_VALIDATORS, SUPPORT_HCAPTCHA_LANGS } from 'core/common_values';
import { simplifyCaughtError, simplifyError } from 'simplify-error';
import { Validator } from 'guard-object';
import { ClickableBold, ClickableImg } from '../../components/ClickableDiv/ClickableDiv';

const RedFieldStyle = {
    backgroundColor: 'var(--good-red-blur)',
    border: '1px solid var(--good-red-blur)'
};

let getAuthExtras;

export const setAuthInitiator = func => {
    getAuthExtras = func;
}

export default function ClientPage({ params, translations, theme_config, lang }) {
    const isDarkMode = useDarkMode(theme_config);

    const [isPasswordVisible, setPasswordVisible] = useState(),
        [isInSignupTab, setInSignupTab] = useState(),
        [isLoginLoading, setLoginLoading] = useState(),
        [isLoginGoogle, setLoginingGoogle] = useState(),
        [isAppleLoginin, setAppleLogin] = useState(),
        [isLoginEmailValid, setLoginEmailValid] = useState(),
        [isLoginPasswordValid, setLoginPasswordValid] = useState(),
        [isSignupEmailValid, setSignupEmailValid] = useState(),
        [isSignupPasswordValid, setSignupPasswordValid] = useState(),
        [isSignupNameValid, setSignupNameValid] = useState();

    const botDetector = useRef(),
        captchaToken = useRef(),
        hasMountedResetCaptcha = useRef();

    const isOnline = useIsOnline();

    useEffect(() => {
        if (typeof isOnline !== 'boolean') return;
        if (isOnline && hasMountedResetCaptcha.current)
            botDetector.current.resetCaptcha();

        hasMountedResetCaptcha.current = true;
    }, [isOnline]);

    useEffect(() => {
        document.title = `${translations[isInSignupTab ? 'signup' : 'login']} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    }, [isInSignupTab]);

    const { openFancyDialog } = useFancyDialog();

    const isPageLoading = !!(isLoginLoading || isLoginGoogle || isAppleLoginin),
        isFormValid = (typeof (isInSignupTab ? isSignupEmailValid : isLoginEmailValid) !== 'boolean') ||
            (isInSignupTab ? (isSignupEmailValid && isSignupNameValid && isSignupPasswordValid)
                : (isLoginEmailValid && isLoginPasswordValid));

    const checkEmailValidity = (t = '') => Validator.EMAIL(t.trim());
    const checkPasswordValidity = (t = '') => t.length >= 3;
    const checkNameValidity = (t = '') => FIELD_VALIDATORS.fullname(t.trim());

    const ensureCaptcha = async () => {
        if (!captchaToken.current)
            if (!(captchaToken.current = await botDetector.current.execute({ async: true }))) {
                botDetector.current.resetCaptcha();
                throw simplifyError('recaptcha_failed', 'recaptcha_failed_des');
            }
    }

    const loginAccount = async () => {
        const username = isInSignupTab ? document.querySelector('#username-auth-input').value : '',
            email = document.querySelector('#email-auth-input').value,
            password = document.querySelector('#password-auth-input').value;

        if (
            !(
                checkEmailValidity(email) &&
                checkPasswordValidity(password) &&
                (isInSignupTab ? checkNameValidity(username) : true)
            )
        ) {
            (isInSignupTab ? setSignupEmailValid : setLoginEmailValid)(checkEmailValidity(email));
            (isInSignupTab ? setSignupPasswordValid : setLoginPasswordValid)(checkPasswordValidity(password));
            if (isInSignupTab) setSignupNameValid(checkNameValidity(username));
            return;
        }

        const extras = await getAuthExtras?.(isInSignupTab ? 'sign_up' : 'login');

        setLoginLoading(true);
        try {
            if (isInSignupTab) await ensureCaptcha();

            const logAuth = (user, event) => {
                if (!user.user.authVerified)
                    serializeStorage(internal_storage_keys.AUTO_SEND_VERIFY, user.user.entityOf);

                logEvent(getAnalytics(CONFIG_STATE.FIREBASE_APP), event, {
                    value: AUTH_PROVIDER_ID.PASSWORD
                });
            }

            if (isInSignupTab) {
                const user = await auth().customSignup(email, password, username.trim(), { captcha: captchaToken.current.response, ...extras });
                logAuth(user, 'sign_up');
            } else {
                const user = await auth().customSignin(email, password);
                logAuth(user, 'login');
            }

            setLoginLoading(false);
        } catch (e) {
            console.error('login error:', e);
            let { error, message } = simplifyCaughtError(e).simpleError;
            if (['user_not_found'].includes(error))
                message = `${error}_des`;

            openFancyDialog({
                title: translations[error] || error,
                message: translations[message] || message,
                img: '/assets/caution.png',
                yesTxt: translations.dismiss,
                hideNo: true
            });
            setLoginLoading(false);
        }
    };

    const showErrorDialog = e => {
        console.error('login error:', e);
        const { error, message } = simplifyCaughtError(e).simpleError;
        openFancyDialog({
            title: translations[error] || `${error}`,
            message: translations[message] || `${message}`,
            img: '/assets/caution.png',
            yesTxt: translations.dismiss,
            hideNo: true
        });
    }

    return (
        <div className="con-auth-screen">
            <div className='page-stretcher-auth-screen'>

                <div id='page-stretcher-auth-screen-float-bg' />

                <div className='thickBG cont-pack-auth-screen'>

                    <div className="cont-auth-screen">

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

                        <div className='header-auth-screen'>
                            <Link href={langy('/', params)}>
                                <img src={'/assets/logo.png'} alt={`${process.env.NEXT_PUBLIC_APP_NAME} Logo`} />
                            </Link>
                            <h1>
                                {translations.login_manage_account}
                            </h1>
                        </div>

                        <form
                            className='auth-form-auth-screen'
                            onSubmit={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                    isFormValid &&
                                    !isPageLoading
                                ) loginAccount();
                            }}>
                            <div
                                style={
                                    (!isFormValid && !(isInSignupTab ? isSignupEmailValid : isLoginEmailValid)) ? RedFieldStyle : undefined
                                }>
                                <input
                                    type={'email'}
                                    required
                                    placeholder={translations.email_address}
                                    id='email-auth-input'
                                    disabled={isPageLoading}
                                    onChange={e => {
                                        const { value } = e.currentTarget;

                                        if (typeof (isInSignupTab ? isSignupEmailValid : isLoginEmailValid) === 'boolean')
                                            (isInSignupTab ? setSignupEmailValid : setLoginEmailValid)(checkEmailValidity(value));
                                    }} />
                            </div>

                            {isInSignupTab ?
                                <div
                                    style={(!isFormValid && isInSignupTab && !isSignupNameValid) ? RedFieldStyle : undefined}>
                                    <input
                                        type={'text'}
                                        autoComplete='name'
                                        required
                                        placeholder={translations.firstname_lastname}
                                        id='username-auth-input'
                                        disabled={isPageLoading}
                                        onChange={e => {
                                            const { value } = e.currentTarget;

                                            if (typeof isSignupNameValid === 'boolean')
                                                setSignupNameValid(checkNameValidity(value));
                                        }} />
                                </div>
                                : null}

                            <div style={(!isFormValid && !(isInSignupTab ? isSignupPasswordValid : isLoginPasswordValid)) ? RedFieldStyle : undefined}>
                                <input
                                    type={isPasswordVisible ? 'text' : 'password'}
                                    required
                                    placeholder={translations.password}
                                    id='password-auth-input'
                                    disabled={isPageLoading}
                                    onChange={e => {
                                        const { value } = e.currentTarget;

                                        if (typeof (isInSignupTab ? isSignupPasswordValid : isLoginPasswordValid) === 'boolean')
                                            (isInSignupTab ? setSignupPasswordValid : setLoginPasswordValid)(checkPasswordValidity(value));
                                    }} />
                                <ClickableImg
                                    src={isPasswordVisible ? '/assets/visible.svg' : '/assets/hidden.svg'}
                                    className='button-behaviour invertion'
                                    onClick={() => {
                                        setPasswordVisible(!isPasswordVisible);
                                    }} />
                            </div>
                        </form>

                        {isInSignupTab ?
                            null
                            : <div className='forgot-password-auth-screen'>
                                <Link
                                    href={langy("/reset-password", params)}
                                    className='forgot-password-link-auth-screen'
                                    style={isDarkMode ? { color: 'rgb(0, 189, 252)' } : undefined}>
                                    {translations.forgot_password}
                                </Link>
                            </div>}

                        {isInSignupTab ?
                            <label className='agreement-con-auth-screen'>
                                <input
                                    type='checkbox'
                                    id='signup-agreement-auth-screen'
                                    checked
                                    readOnly />
                                <span>
                                    {`${translations.creating_account_prefix} ${process.env.NEXT_PUBLIC_APP_NAME}, ${translations.creating_account_suffix} `}
                                    <Link
                                        href={'https://brainbehindx.com/legal'}
                                        target='_blank'
                                        style={isDarkMode ? { color: 'rgb(0, 189, 252)' } : undefined}>
                                        {translations.pp_n_tc}
                                    </Link>
                                </span>
                            </label> : null}

                        <button
                            style={{
                                marginTop: isInSignupTab ? 35 : 20,
                                opacity: isFormValid ? 1 : 0.4
                            }}
                            disabled={!isFormValid || isPageLoading}
                            className={`auth-btn-auth-screen rcolor${isFormValid ? ' button-behaviour' : ''}`}
                            onClick={loginAccount}>
                            {translations[isInSignupTab ? 'create_account' : 'login']}
                            {isLoginLoading ?
                                <img src={'/assets/loading.gif'}
                                    className='rinvertion' /> : null}
                        </button>

                        <div className='auth-toggle-auth-screen'>
                            {translations[isInSignupTab ? 'already_have_account' : 'dont_have_account']}
                            <ClickableBold
                                className='button-behaviour'
                                onClick={() => setInSignupTab(!isInSignupTab)}>
                                {` ${translations[isInSignupTab ? 'log_in' : 'sign_up']}`}
                            </ClickableBold>
                        </div>

                        {isInSignupTab ?
                            null
                            : <div className='login-provider-con-auth-screen'>
                                <button
                                    className="thickBG button-behaviour border-toggle"
                                    disabled={isPageLoading}
                                    style={{
                                        color: isDarkMode ? 'white' : 'black',
                                        ...isDarkMode ? { borderWidth: '1px', borderStyle: 'solid' } : {}
                                    }}
                                    onClick={async () => {
                                        setLoginingGoogle(true);
                                        try {
                                            await appendScriptSrc({ src: 'https://accounts.google.com/gsi/client', async: true, defer: true });
                                        } catch (e) {
                                            setLoginingGoogle(false);
                                            showErrorDialog(e);
                                            return;
                                        }
                                        const googleAuth = google.accounts.oauth2.initCodeClient({
                                            client_id: process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID,
                                            scope: 'openid profile email',
                                            flow: 'auth-code',
                                            callback: async (res) => {
                                                console.log("google popup res:", res);
                                                try {
                                                    const extras = await getAuthExtras?.(AUTH_PROVIDER_ID.GOOGLE);

                                                    const user = await auth().googleSignin(res.code, extras);
                                                    logEvent(getAnalytics(CONFIG_STATE.FIREBASE_APP), user.isNewUser ? 'sign_up' : 'login', {
                                                        value: AUTH_PROVIDER_ID.GOOGLE
                                                    });
                                                } catch (e) {
                                                    setLoginingGoogle(false);
                                                    showErrorDialog(e);
                                                }
                                            },
                                            error_callback: e => {
                                                console.log('error:', e);
                                                setLoginingGoogle(false);
                                                if (e?.type !== 'popup_closed') {
                                                    const trans = {
                                                        popup_failed_to_open: 'unable_open_google_popup'
                                                    }[e?.type] || (!e?.message && !e?.error_description && 'unexpected_error_occurred');

                                                    alert(trans ? translations[trans] : (e.message || e.error_description));
                                                }
                                            }
                                        });
                                        googleAuth.requestCode();
                                    }}>
                                    <img src={isLoginGoogle ? '/assets/loading.gif' : '/assets/google.png'}
                                        className={isLoginGoogle ? 'invertion' : undefined} />
                                    <span>
                                        {translations.continue_with_google}
                                    </span>
                                </button>

                                <button
                                    className='thickBG button-behaviour border-toggle'
                                    disabled={isPageLoading}
                                    style={{
                                        color: isDarkMode ? 'white' : 'black',
                                        ...isDarkMode ? { borderWidth: '1px', borderStyle: 'solid' } : {}
                                    }}
                                    onClick={async () => {
                                        if (!process.env.APPLE_AUTH_SERVICE_ID) {
                                            openFancyDialog({
                                                title: 'Feature',
                                                message: 'This feature is currently under development',
                                                img: '/assets/caution.png',
                                                yesTxt: 'Ok, Got It',
                                                hideNo: true
                                            });
                                            return;
                                        }

                                        const extras = await getAuthExtras?.(AUTH_PROVIDER_ID.APPLE);

                                        setAppleLogin(true);
                                        try {
                                            await appendScriptSrc({ src: 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js' });
                                        } catch (e) {
                                            setAppleLogin(false);
                                            return;
                                        }

                                        try {
                                            window.AppleID.auth.init({
                                                clientId: process.env.APPLE_AUTH_SERVICE_ID,
                                                scope: 'name email',
                                                redirectURI: process.env.APPLE_AUTH_REDIRECTION,
                                                usePopup: true
                                            });
                                            const data = await window.AppleID.auth.signIn();
                                            if (data.error) throw data.error;

                                            const id_token = data.authorization.id_token;
                                            console.log('appleRes:', data);
                                            const { email } = JSON.parse(atob(id_token.split('.')[1]));
                                            const preObj = JSON.parse(await deserializeStorage(internal_storage_keys.APPLE_PERSISTED_USER) || '{}');

                                            let fullName = data?.user?.name;

                                            if (fullName) {
                                                fullName = `${fullName.firstName} ${fullName.lastName}`;
                                                preObj[email] = fullName;
                                                await serializeStorage(internal_storage_keys.APPLE_PERSISTED_USER, JSON.stringify(preObj));
                                            } else fullName = preObj[email];

                                            console.log('fullName:', fullName);

                                            const user = await auth().appleSignin(id_token, { fullName, ...extras });
                                            logEvent(getAnalytics(CONFIG_STATE.FIREBASE_APP), user.isNewUser ? 'sign_up' : 'login', {
                                                value: AUTH_PROVIDER_ID.APPLE
                                            });
                                        } catch (e) {
                                            if (e?.error !== 'popup_closed_by_user')
                                                showErrorDialog(e);
                                            setAppleLogin(false);
                                        }
                                    }}>
                                    <img src={isAppleLoginin ? '/assets/loading.gif' : '/assets/apple.png'}
                                        className={'invertion'} />
                                    <span>
                                        {translations.continue_with_apple}
                                    </span>
                                </button>
                            </div>
                        }
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