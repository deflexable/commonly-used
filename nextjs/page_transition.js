import { useEffect, useState } from "react";

const showForHashAnchor = true;

export const usePageTransition = () => {
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        /**
         * Handle links and navigator element clicks
         * @param {MouseEvent} event
         * @returns {void}
         */
        function handleClick(event) {
            try {
                const target = event.target;
                const anchor = findClosestAnchor(target);
                const newUrl = anchor?.href;
                if (newUrl) {
                    const currentUrl = window.location.href;
                    const isExternalLink = anchor.target !== '';

                    // Check for Special Schemes
                    const isSpecialScheme = ['tel:', 'mailto:', 'sms:', 'blob:', 'download:'].some((scheme) =>
                        newUrl.startsWith(scheme)
                    );

                    const notSameHost = !isSameHostName(window.location.href, anchor.href);
                    if (notSameHost) {
                        return;
                    }

                    const isAnchorOrHashAnchor =
                        isAnchorOfCurrentUrl(currentUrl, newUrl) || isHashAnchor(window.location.href, anchor.href);
                    if (!showForHashAnchor && isAnchorOrHashAnchor) {
                        return;
                    }

                    if (
                        newUrl === currentUrl ||
                        isExternalLink ||
                        isSpecialScheme ||
                        isAnchorOrHashAnchor ||
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey ||
                        !toAbsoluteURL(anchor.href).startsWith('http')
                    ) {
                        // setTransitioning(true);
                        // setTransitioning(false);
                    } else {
                        setTransitioning(true);
                    }
                }
            } catch (err) {
                // Log the error in development only!
                console.log('anchor handleClick error: ', err);
                setTransitioning(true);
                setTransitioning(false);
            }
        }

        const thisHistory = window.history;
        let scheduleFinish = () => {
            setTimeout(() => {
                setTransitioning(false);
            }, 0);
        }

        // Complete TopLoader Progress on adding new entry to history stack
        const pushState = thisHistory.pushState;
        thisHistory.pushState = (...args) => {
            scheduleFinish?.();
            return pushState.apply(thisHistory, args);
        };

        // Complete TopLoader Progress on replacing current entry of history stack
        const replaceState = thisHistory.replaceState;
        thisHistory.replaceState = (...args) => {
            scheduleFinish?.();
            return replaceState.apply(thisHistory, args);
        };

        function handlePageHide() {
            setTransitioning(false);
        }

        function handlePop() {
            setTransitioning(true);
        }

        window.addEventListener('popstate', handlePop);
        document.addEventListener('click', handleClick);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            scheduleFinish = undefined;
            document.removeEventListener('click', handleClick);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('popstate', handlePop);
        };
    }, []);

    return transitioning;
}

/**
 * Find the closest anchor to trigger
 * @param {HTMLElement | null} element
 * @returns {Element}
 */
function findClosestAnchor(element) {
    while (element && element.tagName.toLowerCase() !== 'a') {
        element = element.parentElement;
    }
    return element;
}

/**
 * Check if the Current Url is same as New Url
 * @param {string} currentUrl
 * @param {string} newUrl
 * @returns {boolean}
 */
function isAnchorOfCurrentUrl(currentUrl, newUrl) {
    const currentUrlObj = new URL(currentUrl);
    const newUrlObj = new URL(newUrl);
    // Compare hostname, pathname, and search parameters
    if (
        currentUrlObj.hostname === newUrlObj.hostname &&
        currentUrlObj.pathname === newUrlObj.pathname &&
        currentUrlObj.search === newUrlObj.search
    ) {
        // Check if the new URL is just an anchor of the current URL page
        const currentHash = currentUrlObj.hash;
        const newHash = newUrlObj.hash;
        return (
            currentHash !== newHash && currentUrlObj.href.replace(currentHash, '') === newUrlObj.href.replace(newHash, '')
        );
    }
    return false;
}

/**
 * Check if it is Same Host name
 * @param {string} currentUrl Current Url Location
 * @param {string} newUrl New Url detected with each anchor
 * @returns {boolean}
 */
const isSameHostName = (currentUrl, newUrl) => {
    const current = new URL(toAbsoluteURL(currentUrl));
    const next = new URL(toAbsoluteURL(newUrl));
    return current.hostname.replace(/^www\./, '') === next.hostname.replace(/^www\./, '');
};

/**
 * Check if it is hash anchor or same page anchor
 * @param {string} currentUrl Current Url Location
 * @param {string} newUrl New Url detected with each anchor
 * @returns {boolean}
 */
const isHashAnchor = (currentUrl, newUrl) => {
    const current = new URL(toAbsoluteURL(currentUrl));
    const next = new URL(toAbsoluteURL(newUrl));
    return current.href.split('#')[0] === next.href.split('#')[0];
};

/**
 * Convert the url to Absolute URL based on the current window location.
 * @param {string} url
 * @returns {string}
 */
const toAbsoluteURL = (url) => {
    return new URL(url, window.location.href).href;
};