export function serializeStorage(key: any, value: any): Promise<any>;
export function deserializeStorage(key: string, callback: (res: string, err?: Error | undefined) => void): Promise<string | undefined>;
export function makeCacher(): {};
