import "server-only";
import { cache } from 'react';

const dispatchMessage = cache(
    async (command) => {
        console.log('bridging: ', command.substring(0, 70));

        const response = await fetch(process.env.BRIDGING_URL || `http://localhost:${process.env.API_PORT}`.concat('/server_bridging'), {
            headers: {
                'content-type': 'application/json',
                'password': process.env.INTER_SERVER_PASSKEY
            },
            method: 'POST',
            body: command
        });
        const { success, data } = await response.json();
        if (success) return data;
        throw data;
    }
);

/**
 * @type {(route: string, obj: { request?: Request; user?: AuthData; })=> Promise<{ response: any; status: Response['status'] }>}
 */
export const apiFeeder = (route, obj) => dispatchMessage(JSON.stringify({ apiCommand: { route, obj } }));

/**
 * @template U, T, F
 * @param {(snapshot: { mserver: import('../../../server/node_modules/mosquito-transport').default, collection: import('../../../server/node_modules/mosquito-transport').default['db']['collection'], info?: U, functions?: F, DbPath: import("core/common_values")['DbPath'], extractor: import("core/common_values")['COMMON_OBJECT_EXTRACTIONS'] }) => Promise<T>} executor 
 * @param {U} info 
 * @param {F} functions
 * @returns {Promise<T>}
 */
export const executeMserver = (executor, info, functions = {}) => {
    functions =
        `{${Object.entries(functions).map(([k, v]) => {
            if (typeof v !== 'function') throw `executeMserver third argument has an invalid value of "${v}" at object key:${k} but expected a function`;
            return `"${k}": ${v}`;
        })}}`;

    return dispatchMessage(
        JSON.stringify({
            mserverCommand: {
                executor: `(args) => { const functions = ${functions}; return (${executor})({ ...args, functions }); }`,
                info
            }
        })
    );
}