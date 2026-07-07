import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { one_year } from "../../common/timing.js";

const DefaultMaxAge = (one_year * 50) / 1000;

/**
 * @param {Request} request 
 * @returns {Response}
 */
export async function POST(request) {
    let success;
    let error;

    try {
        const [reqData, cookieStore] = await Promise.all([
            request.json(),
            cookies()
        ]);

        reqData.forEach(item => {
            const { data: [node, value], expires, maxAge } = Array.isArray(item) ? { data: item } : item;

            const expiryDate = expires && new Date(expires);

            const isDeletion = [undefined, null].includes(value);

            if (typeof node === 'string' && (isDeletion || typeof value === 'string')) {
                if (isDeletion) {
                    cookieStore.delete(node);
                } else {
                    cookieStore.set(node, value, {
                        httpOnly: true,
                        ...process.env.NODE_ENV === 'production' ? {
                            domain: process.env.COOKIE_DOMAIN,
                            secure: true,
                            sameSite: 'lax'
                        } : {},
                        ...(maxAge === null || expires !== undefined) ? {} : {
                            maxAge: (Number.isInteger(maxAge) && maxAge > 0) ? maxAge : DefaultMaxAge
                        },
                        ...expiryDate?.getTime?.() ? { expires: expiryDate } : {}
                    });
                }
            } else throw `invalid cookie name:${name} and value:${value}`;
        });

        success = true;
    } catch (e) {
        error = `Error: ${e}`;
    }

    return NextResponse.json({ success, error });
}