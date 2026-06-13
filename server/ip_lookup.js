
const DEFAULT_OBJ = {
    fake: true,
    country: 'NG',
    timezone: 'Africa/Lagos',
    city: 'Lagos',
    ll: [6.4474, 3.3903]
};

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