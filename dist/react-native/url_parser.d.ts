export class StandardURL {
    constructor(url: any, base: any);
    _protocol: any;
    _hostname: any;
    _port: any;
    _pathname: any;
    _search: any;
    _hash: any;
    _initSearchParams(): void;
    _searchParams: URLSearchParams;
    set protocol(v: any);
    get protocol(): any;
    set hostname(v: any);
    get hostname(): any;
    set port(v: any);
    get port(): any;
    set pathname(v: any);
    get pathname(): any;
    set search(v: any);
    get search(): any;
    set hash(v: any);
    get hash(): any;
    get searchParams(): URLSearchParams;
    get host(): string;
    get origin(): string;
    set href(v: string);
    get href(): string;
    toString(): string;
}
