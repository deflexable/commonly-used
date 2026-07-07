import sitemap from "../sitemap";

export async function GET(_, { params }) {
    const { category, filename } = await params;

    const data = await sitemap.prettyUrlSet(`./${category}/${filename}`, {
        'xmlns:xhtml': 'http://www.w3.org/1999/xhtml',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1',
        'xmlns:video': 'http://www.google.com/schemas/sitemap-video/1.1'
    });

    return new Response(data, {
        status: 200,
        headers: {
            'content-type': 'application/xml'
        }
    });
}