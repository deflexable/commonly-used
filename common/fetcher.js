
/**
 * @param {URL | import("node-fetch").RequestInfo} url 
 * @param {import("node-fetch").RequestInit} option 
 * @param {number} timeout
 */
export const timeoutFetch = async (url, option, timeout = 60000) => {
    const signal = new AbortController();

    const timer = setTimeout(() => {
        signal.abort();
    }, timeout);

    const r = await fetch(url, { ...option, signal: signal.signal }).then(async h => {
        const response = new Response(await h.arrayBuffer(), {
            headers: h.headers,
            status: h.status,
            statusText: h.statusText
        });
        return response;
    });
    clearTimeout(timer);
    return r;
};