
export const purifyBase64 = (base64) => Buffer.from(base64.replace(/^data:\w+\/\w+;base64,/, ''), 'base64');

export const niceJSONStringify = (obj) => {
    const seen = new WeakSet();

    return JSON.stringify(obj, (_, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    });
}