import { IS_DEV, DEV_PUBLIC_IP_ADDRESS, IP_NODE } from "core/env.js";

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