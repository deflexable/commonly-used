"use client"

import { useState } from 'react';
import { auth, fetchHttp } from '../../client_server';
import { useFancyDialog } from '../../components/ContainerModal/ContainerModals';
import Link from '../../config/next-link';
import { Endpoints } from 'core/common_values';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { CONFIG_STATE } from '../../config/state';
import { simplifyCaughtError } from 'simplify-error';
import { ClickableImg } from '../../components/ClickableDiv/ClickableDiv';

export default function ({ page_data: { errorData, data }, locale }) {

    const [isPageLoading, setPageLoading] = useState(),
        [isPasswordValid, setPasswordValid] = useState(),
        [overrideSuccess, setOverrideSuccess] = useState(),
        [passwordVisible, setPasswordVisible] = useState();

    const { openFancyDialog } = useFancyDialog();

    const isFormValid = typeof isPasswordValid !== 'boolean' || isPasswordValid;
    const isBtnDisabled = !!isPageLoading || !isFormValid;

    const checkValidForm = (t = '') => t.length >= 3;

    const resetPassword = async () => {
        const newPassword = document.querySelector('#password-auth-input').value;

        if (!checkValidForm(newPassword)) {
            setPasswordValid(false);
            return;
        }
        setPageLoading(true);

        try {
            const r = await (
                await fetchHttp(Endpoints.updatePassword, {
                    body: JSON.stringify({ token: data.token, newPassword }),
                    headers: { 'Content-Type': 'application/json' }
                }, {
                    disableAuth: true,
                    retrieval: 'no-cache-no-await'
                })
            ).json();

            if (r.simpleError) throw r;

            logEvent(getAnalytics(CONFIG_STATE.FIREBASE_APP), 'password_reset', {
                value: data.email.trim()
            });

            await auth().customSignin(data.email.trim(), newPassword);

            setPageLoading(false);
            setOverrideSuccess(true);
        } catch (e) {
            const { error, message } = simplifyCaughtError(e).simpleError;

            openFancyDialog({
                title: error,
                message,
                img: '/assets/caution.png',
                yesTxt: locale.dismiss,
                hideNo: true
            });
            setPageLoading(false);
        }
    }

    if (errorData)
        return (
            <div className="con-verification-x thickBG">
                <div className="cont-verification-x">
                    <img src={errorData?.img || '/assets/caution.png'} />
                    <div className="title-verification-x">
                        {locale[errorData.error] || errorData.error}
                    </div>
                    <div className="des-verification-x">
                        {locale[errorData.message] || errorData.message}
                    </div>
                </div>
            </div>
        );

    return (
        <div className="con-auth-screen">
            <div className='page-stretcher-auth-screen'>

                <div id='page-stretcher-auth-screen-float-bg invertion' />

                <div className='thickBG cont-pack-auth-screen'>

                    <div className="cont-auth-screen">
                        {overrideSuccess ?
                            <>
                                <img src='/assets/successful.png'
                                    style={{
                                        width: '70px',
                                        height: '70px',
                                        margin: '15px auto 0px auto',
                                        display: 'block'
                                    }} />

                                <div className='agreement-con-auth-screen'>
                                    <span style={{
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: 18
                                    }}>
                                        {locale.password_update_successful}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        color: 'var(--dblue)',
                                        margin: '20px 10px',
                                        textAlign: 'center',
                                        textDecoration: 'none'
                                    }}>
                                    {`${locale.redirecting}...`}
                                </div>
                            </> :
                            <>
                                <div className='header-auth-screen'>
                                    <Link href='/'>
                                        <img src="/assets/logo.png" />
                                    </Link>
                                    <div>
                                        {locale.update_password_for_email}
                                    </div>
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
                                            type={passwordVisible ? 'text' : 'password'}
                                            required
                                            placeholder={locale.enter_new_password}
                                            id='password-auth-input'
                                            disabled={isPageLoading}
                                            onChange={e => {
                                                if (typeof isPasswordValid === 'boolean')
                                                    setPasswordValid(checkValidForm(e.currentTarget.value.trim()));
                                            }} />
                                        <ClickableImg
                                            src={passwordVisible ? '/assets/visible.svg' : '/assets/hidden.svg'}
                                            className='button-behaviour invertion'
                                            onClick={() => {
                                                setPasswordVisible(!passwordVisible);
                                            }} />
                                    </div>
                                    {isFormValid ? null :
                                        <small style={{
                                            display: 'block',
                                            color: 'var(--good-red)',
                                            textAlign: 'center',
                                            margin: '10px 10px 0px 10px'
                                        }}>
                                            {locale.password_must_greater}
                                        </small>}
                                </form>

                                <div className='agreement-con-auth-screen'>
                                    <span style={{ textAlign: 'center' }}>
                                        {`${locale.please_enter_new_password_for} "${data.email}" ${locale.account}`}
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
                                    {locale.update_password}
                                    {isPageLoading ? <img src='/assets/loading.gif' className='rinvertion' /> : null}
                                </button>
                            </>}
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