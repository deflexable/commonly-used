
const DEFAULT_OBJ = {
    fake: true,
    country: 'US',
    timezone: 'America/New_York',
    city: 'New York',
    ll: [40.7128, -74.0060]
}

export default function ip_lookup(headers) {
    const obj = {};

    [
        ['cf-ipcity', 'city'],
        ['cf-ipcountry', 'country'],
        ['cf-timezone', 'timezone']
    ].forEach(([node, key]) => {
        obj[key] = headers[node];
    });

    obj.ll =
        ['cf-iplatitude', 'cf-iplongitude']
            .map(v => headers[v] * 1);

    if (obj.ll.some(v => isNaN(v)) || !obj.country || !obj.timezone) {
        return DEFAULT_OBJ;
    }

    return obj;
};