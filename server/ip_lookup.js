import geoip from 'geoip-lite';
import { IS_DEV, DEV_PUBLIC_IP_ADDRESS, IP_NODE } from "core/env.js";

const DEFAULT_IP_VALUE = geoip.lookup('98.98.66.34');

const ip_lookup = (ip) => {
    let geo = geoip.lookup(cleanseIP(ip));

    if (!geo) {
        console.error('Failed to lookup request location:', ip);
        geo = DEFAULT_IP_VALUE;
    }

    return geo;
};

globalThis.hotGeoIp = ip_lookup;

export default ip_lookup;

export const cleanseIP = (ip) => {
    if (typeof ip === 'string')
        ip = ip.split(',')[0].trim();
    return ip;
};

export const useRequestIpAssigner = (req, _, next) => {
    req.cip = IS_DEV ? DEV_PUBLIC_IP_ADDRESS : cleanseIP(req.headers?.[IP_NODE]);
    if (req.headers) req.headers.cip = req.cip;
    next();
};