
const IS_DEV =
    typeof __DEV__ === 'boolean'
        ? __DEV__
        : typeof process !== 'undefined'
            ? process?.env?.NODE_ENV === 'development'
            : undefined;

export const warnObject = (o) => {
    if (!IS_DEV) return o;

    return new Proxy(o, {
        get: (t, p) => {
            if (!t?.hasOwnProperty?.(p)) {
                console.warn(`warnables: property '${p}' does not exist on object instance`);
            }

            return t[p];
        },
        set: (t, p, v) => {
            console.log(`warnables: modifying object with property '${p}' is not allowed`);

            return t[p] = v;
        },
        defineProperty: (t, p, a) => {
            console.log(`warnables: defining property '${p}' is not allowed on object`);

            return Object.defineProperty(t, p, a);
        }
    });
}