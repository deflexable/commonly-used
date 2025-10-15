export const one_day: 86400000;
export const one_minute: 60000;
export const one_week: 604800000;
export const one_month: 2419200000;
export const one_hour: 3600000;
export const one_year: number;
export function getSimpleDate(time: any, common: any): string;
export function getSimpleTime(time: any, option?: {
    showDate: boolean;
    format: string;
    common: any;
}): string;
export function getTimeAgo(dateString: any, common: any, currentTime: any): any;
export function getTimeAgoShort(dateString: any, common: any, currentTime: any): any;
export function getTimeAgoShortest(dateString: any, common: any, currentTime: any): any;
export function getTimeAgoAtomic(dateString: any, common: any, currentTime: any): any;
export function timeSince(time: any, options: any): any;
export const MONTHS: string[];
