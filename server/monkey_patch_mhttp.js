
const PATCH_SCOPE = {};

export const patch_m_http = (mserver, { excludedRemoteApis = [], internalApis = [] }) => {
    const listenOriginalHttp = mserver.listenHttpsRequest;

    mserver.listenHttpsRequest = (route, callback, options) => {
        websiteApiFeederEntry(route, callback, options);
        if (!excludedRemoteApis.includes(route))
            listenOriginalHttp(route, callback, options);
    };

    // api feeder
    const feedApi = (routes, callback) => {
        PATCH_SCOPE[routes] = (params) =>
            new Promise(async (resolve, reject) => {
                try {
                    const { request, user } = params || {};
                    const responseBuilder = {
                        status: (status) => ({
                            send: (data) => {
                                resolve({ response: data, status });
                            }
                        })
                    };

                    await callback?.(request, responseBuilder, user);
                } catch (error) {
                    reject(error);
                }
            });
    };

    function websiteApiFeederEntry() {
        const list = [...arguments];
        if (internalApis.includes(list[0])) feedApi(...list);
    }
};

/**
 * @param {string} route 
 * @param {{ request: import('express').Request, user?: import('mosquito-transport').AuthData | undefined }} param
 * @returns {Promise<{response: any, status: number}>}
 */
export const callInternalApi = (route, param) => PATCH_SCOPE[route](param);