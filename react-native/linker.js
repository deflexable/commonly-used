import { useEffect, useRef } from "react";
import app_navigator from "./app_navigator";
import { auth, mserver } from "./client_server";

export function handle_password_reset(linkObj) {
    linkObj.searchParams.set('native', 'yes');

    return {
        uri: linkObj.href,
        useDocumentEvent: (event) => {
            const hasPopScreen = useRef();

            useEffect(() => {
                try {
                    const { action, email, password } = JSON.parse(event);

                    if (action === 'native-signin') {
                        if (!mserver.user) {
                            auth().customSignin(email.trim(), password)
                                .catch(() => {
                                    if (!hasPopScreen.current)
                                        app_navigator.goBack();
                                })
                                .finally(() => {
                                    setTimeout(() => {
                                        if (!hasPopScreen.current)
                                            app_navigator.goBack();
                                    }, 2000);
                                });
                        } else app_navigator.goBack();
                    }
                } catch (error) {
                    console.error('override_password err:', error);
                }
            }, [event]);

            useEffect(() => {
                return () => {
                    hasPopScreen.current = true;
                }
            }, []);
        }
    };
}