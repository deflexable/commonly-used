export const CURRENCIES: {
    key: string;
    symbol: string;
    name: string;
    decimal: number;
    country: {
        code: string;
        name: string;
    }[];
}[];
export function myMoney(currency: any): {
    key: string;
    symbol: string;
    name: string;
    decimal: number;
    country: {
        code: string;
        name: string;
    }[];
};
