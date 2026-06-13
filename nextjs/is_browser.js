
export const isBrowser = () => {
    try {
        if (!window.location || !document) throw '';
        return true;
    } catch (e) {
        return false;
    }
};