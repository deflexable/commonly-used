import { WEB_PROCESS } from 'bbx-commonly-used/web/scope';

/**
 * @type {() => import('mosquito-transport').default}
 */
export const thisServer = () => globalThis.hotServer;

/**
 * @type {import('mongodb').Db['collection']}
 */
export function thisCollection() {
    return thisServer().getDatabase().collection(...arguments);
}

/**
 * @type {(ip: string)=> import('geoip-lite').Lookup}
 */
export const serverGeoIp = (ip) => globalThis.hotGeoIp(ip);

/**
 * @type {(route: string, obj: { request?: Request; user?: AuthData; })=> Promise<{ response: any; status: Response['status'] }>}
 */
export const apiFeeder = (route, obj) => globalThis.mosquitoApis[route](obj);

/**
 * @type {import('../../../../core/env')}
 */
export const ENV = new Proxy({}, {
    get: (_, n) => (globalThis.proccessVariable || WEB_PROCESS.env)[n]
});