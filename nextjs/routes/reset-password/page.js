import { getLoaderData, installLoaderData } from "../../loader";
import ClientPage from "./page.client";
import { getGraphMetadata } from "../../utils.server";
import { SUPPORTED_LANGUAGES_LIST } from "core/common_values";
import "../auth/page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const title = `${loader.main_locale.meta_title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    const shouldIndex = !loader.url_instance.searchParams.size;

    return {
        title,
        robots: { index: shouldIndex, follow: shouldIndex },
        ...getGraphMetadata({
            title,
            locale: loader.locale.name,
            url: loader.url_instance.href,
            locale_list: SUPPORTED_LANGUAGES_LIST
        })
    };
}

export default async function ({ params, searchParams }) {
    const loader =
        await installLoaderData({
            params,
            lang: 'reset_password',
            pathname: '/reset-password',
            searchParams,
            stopRedirection: true
        });

    return (
        <ClientPage
            params={loader.params}
            lang={loader.locale.name}
            routerSearch={loader.url_instance.search}
            theme_config={loader.theme_config}
            locale={loader.locale.data}
        />
    );
}