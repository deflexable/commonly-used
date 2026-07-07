import { getLoaderData, installLoaderData } from "../../loader";
import ClientPage from "./page.client";
import { getGraphMetadata } from "../../utils.server";
import { SUPPORTED_LANGUAGES_LIST } from "core/common_values";
import "./page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const shouldIndex = !loader.url_instance.searchParams.size;
    const locale = loader.locale.data;
    const title = `${locale.login} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    const description = `${locale.login_to} ${process.env.NEXT_PUBLIC_APP_NAME} ${locale.to_manage_account}`;

    return {
        title,
        description,
        robots: {
            index: shouldIndex,
            follow: shouldIndex
        },
        ...getGraphMetadata({
            title,
            description,
            locale: loader.locale.name,
            url: loader.url_instance.href,
            locale_list: SUPPORTED_LANGUAGES_LIST
        })
    };
}

export default async function ({ params, searchParams }) {
    const loader = await installLoaderData({
        params,
        lang: 'auth',
        pathname: '/auth',
        searchParams,
        stopRedirection: true
    });

    return (
        <ClientPage
            params={loader.params}
            theme_config={loader.theme_config}
            translations={loader.locale.data}
            lang={loader.locale.name} />
    );
}