import { Image, TouchableOpacity, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { AppTitleBar, commonAppBarStyle } from "./AppBars";
import { Colors } from "@/src/utils/values";
import TextView from "./TextView";
import { useTranslation } from '../locale';
import { Scope } from "@/src/utils/scope";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, fetchHttp } from "../client_server";
import { simplifyCaughtError } from "simplify-error";
import { Back } from "@/src/utils/assets";
import { alertDialog, alertNull, useStyle } from "../page_helper.js";
import { randomString } from "../../common/methods.js";
import { PageLoader } from "./TemplateItems";

let thatCode;

export default function () {
    const { styles } = useStyle(styling);
    const { translations, lang } = useTranslation();
    const { bottom: bottomSpace } = useSafeAreaInsets();

    const [resendEmailTimer, setResendEmailTimer] = useState(60);
    const [isCreatingVerificationEmail, setCreatingVerificationEmail] = useState(Scope.doAutoSendVerificationEmail);
    const [deviceCode, setDeviceCode] = useState();

    const timer = useRef();

    const countdown = () => {
        clearInterval(timer.current);
        setResendEmailTimer(60);
        let secs = 60;

        timer.current = setInterval(() => {
            if (!--secs) clearInterval(timer.current);
            setResendEmailTimer(secs);
        }, 1000);
    }

    const createVerificationEmail = async () => {
        setCreatingVerificationEmail(true);

        try {
            const code = thatCode || (thatCode = randomString(4, true, false, false));
            Scope.verificationRequestCode = code;
            const res = await (
                await fetchHttp(
                    'createVerificationEmail',
                    { body: { code, lang } },
                    { retrieval: 'no-cache-no-await' }
                )
            ).json();
            if (res.status !== 'sent') throw res;
            setDeviceCode(code);
            countdown();
        } catch (e) {
            setResendEmailTimer(0);
            const { error, message } = simplifyCaughtError(e).simpleError || {};
            alertNull(
                translations[error] || error || translations.error,
                translations[message] || message || error
            );
        }

        setCreatingVerificationEmail(false);
    }

    useEffect(() => {
        if (Scope.doAutoSendVerificationEmail) {
            Scope.doAutoSendVerificationEmail = undefined;
            createVerificationEmail();
        } else countdown();
        return () => {
            clearInterval(timer.current);
            Scope.verificationRequestCode = undefined;
        }
    }, []);

    const disabledVerification = !!isCreatingVerificationEmail || !!resendEmailTimer;

    return (
        <View style={styles.main}>
            <AppTitleBar
                leading={
                    <TouchableOpacity
                        style={styles.tabbarBtnLeft}
                        onPress={() => {
                            alertDialog(translations.cancel_verification, translations.cancel_verification_des, () => {
                                auth().signOut();
                            });
                        }}>
                        <Image
                            style={styles.titleBarIcon}
                            source={Back}
                        />
                    </TouchableOpacity>
                }
                center={true}
                title={
                    <TextView style={styles.screenTitle}>
                        {translations.verify_email}
                    </TextView>
                }
            />
            {isCreatingVerificationEmail
                ? <PageLoader /> :
                <View style={styles.pageContentCon}>
                    <Image
                        source={require('@/src/assets/inbox.png')}
                        style={styles.inboxImg} />
                    <TextView style={styles.inboxTitle}>
                        {translations.check_your_inbox}
                    </TextView>
                    <TextView style={styles.inboxDes}>
                        {`${translations.sent_verification_email_prefix} ${Scope.user?.email}, ${translations.sent_verification_email_suffix}`}
                    </TextView>
                    {deviceCode ?
                        <TextView style={styles.deviceCodeTxt}>
                            {`${translations.your_device_code_is} ${deviceCode}`}
                        </TextView> : null}
                    <View
                        style={{
                            position: 'absolute',
                            bottom: bottomSpace + 9,
                            width: '100%'
                        }}>
                        <TextView style={styles.didntCodeTxt}>
                            {translations.dont_receive_code}
                        </TextView>
                        <TouchableOpacity
                            style={disabledVerification ? [styles.inboxBtnCon, { opacity: 0.4 }] : styles.inboxBtnCon}
                            disabled={disabledVerification}
                            onPress={createVerificationEmail}>
                            <TextView
                                invertColor
                                style={styles.inboxBtnTxt}>
                                {`${translations[isCreatingVerificationEmail ? 'sending_email' : 'resend_email']}${isCreatingVerificationEmail ? '..' : resendEmailTimer ? ' ' + resendEmailTimer + 's' : ''}`}
                            </TextView>
                        </TouchableOpacity>
                    </View>
                </View>}
        </View>
    );
}

const styling = {
    ...commonAppBarStyle,

    pageContentCon: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 15,
        maxWidth: 450,
        justifyContent: 'center'
    },

    inboxImg: {
        width: 110,
        height: 110
    },

    inboxTitle: {
        fontWeight: 'bold',
        fontSize: 21,
        marginTop: 20,
        textAlign: 'center'
    },

    inboxDes: {
        color: Colors.gray,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 23,
        marginHorizontal: 20
    },

    inboxBtnCon: {
        backgroundColor: Colors.themeColor,
        paddingVertical: 14,
        borderRadius: 7,
        marginTop: 10
    },

    inboxBtnTxt: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16
    },

    deviceCodeTxt: {
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 5,
        textAlign: 'center'
    },

    didntCodeTxt: {
        color: Colors.gray,
        fontSize: 12,
        textAlign: 'center'
    }
};