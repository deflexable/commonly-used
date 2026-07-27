"use client"

import { SUPPORTED_LANGUAGES } from "core/common_values";
import { useEffect } from "react";

export default function ClientPage() {

    useEffect(() => {
        setTimeout(() => {
            let redirection = '';
            let lang = location.pathname.split('/')[1];

            if (lang && SUPPORTED_LANGUAGES[lang]) {
                lang = '/' + lang;
            } else lang = '';

            if (location.pathname.length > 1 || location.search || location.hash) {
                redirection = '?redirect='.concat(encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)).concat();
            }

            location.href = `${lang}/auth${redirection}`;
        }, 0);
    }, []);

    return null;
}