
export class StandardURL {
    constructor(url, base) {
        // Resolve relative URLs if a base is provided
        if (base) {
            let baseObj = new StandardURL(base);
            if (url.startsWith('/')) {
                url = baseObj.origin + url;
            } else {
                let basePath = baseObj.pathname;
                const lastSlash = basePath.lastIndexOf('/');
                if (lastSlash !== -1) basePath = basePath.slice(0, lastSlash + 1);
                url = baseObj.origin + basePath + url;
            }
        }

        // Parse the URL components
        const urlPattern = /^(https?:)\/\/([^\/:?#]+)(:\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/;
        const match = url.match(urlPattern);
        if (!match) throw new Error(`Invalid URL: ${url}`);

        this._protocol = match[1];                     // "https:"
        this._hostname = match[2];                     // "example.com"
        this._port = match[3] ? match[3].slice(1) : ""; // "8080"
        this._pathname = match[4] || "/";              // "/path"
        this._search = match[5] || "";               // "?a=1&b=2" or ""
        this._hash = match[6] || "";               // "#hash" or ""

        // Initialize searchParams and hook its mutators
        this._initSearchParams();
    }

    // (Re)create and hook searchParams from this._search
    _initSearchParams() {
        this._searchParams = new URLSearchParams(this._search.slice(1));
        const updateSearch = () => {
            const s = this._searchParams.toString();
            this._search = s ? `?${s}` : "";
        };
        // Hook mutating methods
        ['set', 'delete', 'append', 'sort'].forEach(method => {
            const orig = this._searchParams[method].bind(this._searchParams);
            this._searchParams[method] = (...args) => {
                const result = orig(...args);
                updateSearch();
                return result;
            };
        });
    }

    // --- protocol ---
    get protocol() { return this._protocol; }
    set protocol(v) {
        if (!v.endsWith(':')) v += ':';
        this._protocol = v;
    }

    // --- hostname ---
    get hostname() { return this._hostname; }
    set hostname(v) { this._hostname = v; }

    // --- port ---
    get port() { return this._port; }
    set port(v) { this._port = v; }

    // --- pathname ---
    get pathname() { return this._pathname; }
    set pathname(v) {
        if (!v.startsWith('/')) v = '/' + v;
        this._pathname = v;
    }

    // --- search ---
    get search() { return this._search; }
    set search(v) {
        if (v && !v.startsWith('?')) v = '?' + v;
        this._search = v;
        this._initSearchParams();
    }

    // --- hash ---
    get hash() { return this._hash; }
    set hash(v) {
        if (v && !v.startsWith('#')) v = '#' + v;
        this._hash = v;
    }

    // Expose the fully‑hooked URLSearchParams
    get searchParams() {
        return this._searchParams;
    }

    // Derived props
    get host() { return this._hostname + (this._port ? `:${this._port}` : ""); }
    get origin() { return `${this._protocol}//${this.host}`; }

    // href getter re‑assembles; setter re‑parses
    get href() {
        return this.origin + this._pathname + this._search + this._hash;
    }
    set href(v) {
        const tmp = new StandardURL(v);
        this._protocol = tmp._protocol;
        this._hostname = tmp._hostname;
        this._port = tmp._port;
        this._pathname = tmp._pathname;
        this._search = tmp._search;
        this._hash = tmp._hash;
        this._initSearchParams();
    }

    toString() {
        return this.href;
    }
}