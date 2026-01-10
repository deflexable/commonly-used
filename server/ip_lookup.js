import geoip from 'geoip-lite';
import { cleanseIP } from './ip_utils';

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