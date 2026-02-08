import { useRef, useState } from "react";
import { useNavigation } from "@remix-run/react";

export default function ({ }) {
    const navigation = useNavigation();

    const [styleClass, setStyleClass] = useState();

    const wasLoading = useRef();
    const timer = useRef();

    if (wasLoading.current && navigation.state !== 'loading') { // has finish loading
        clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            setStyleClass(' finish-loading-instant');
        }, 100);

        timer.current = setTimeout(() => {
            setStyleClass(' finish-loading-state-killer');
        }, 600);
    } else if (!wasLoading.current && navigation.state === 'loading') { // has begin loading
        clearTimeout(timer.current);

        timer.current = setTimeout(() => {

            setStyleClass(' start-loading-page-transition');
        }, 100);
    }

    wasLoading.current = navigation.state === 'loading';

    return <div className={`page-loading-indicator-div-con${styleClass || ''}`} />
}