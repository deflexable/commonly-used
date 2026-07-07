import SiteMapStorage from 'sitemap-storage';

export default new SiteMapStorage({
    hostname: process.env.NEXT_PUBLIC_WEB_BASE_URL,
    storageDirectory: process.env.SITEMAP_DIRECTORY
});