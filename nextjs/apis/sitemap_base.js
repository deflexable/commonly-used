import sitemap from "../sitemap";

export async function GET() {
    const data = await sitemap.prettySiteMapIndex('./', 'sitemaps');
    return new Response(data, {
        status: 200,
        headers: {
            'content-type': 'application/xml'
        }
    });
}