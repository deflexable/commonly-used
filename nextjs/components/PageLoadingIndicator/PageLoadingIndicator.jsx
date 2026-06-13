"use client"

import { useRef, useState } from "react";
import { usePageTransition } from "../../page_transition";
import "./PageLoadingIndicator.css";

export default function () {
    const loading = usePageTransition();

    const [styleClass, setStyleClass] = useState();

    const wasLoading = useRef();
    const timer = useRef();

    if (wasLoading.current && !loading) { // has finish loading
        clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            setStyleClass(' finish-loading-instant');
        }, 100);

        timer.current = setTimeout(() => {
            setStyleClass(' finish-loading-state-killer');
        }, 600);
    } else if (!wasLoading.current && loading) { // has begin loading
        clearTimeout(timer.current);

        timer.current = setTimeout(() => {

            setStyleClass(' start-loading-page-transition');
        }, 100);
    }

    wasLoading.current = loading;

    return <div className={`page-loading-indicator-div-con${styleClass || ''}`} />
}