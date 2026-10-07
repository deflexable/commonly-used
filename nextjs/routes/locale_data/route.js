import { getLocales } from "../../config/locale";

export async function GET(_, { params }) {
    const { lang, name } = await params;

    try {
        const data = getLocales(lang, name)?.[1];
        if (!data) throw null;

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'content-type': 'application/json'
            }
        });
    } catch (error) {
        return new Response('Page Not Found', {
            status: 404,
            headers: {
                'content-type': 'text/plain'
            }
        });
    }
}