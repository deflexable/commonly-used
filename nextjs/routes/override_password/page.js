import { getLoaderData, installLoaderData } from "../../loader";
import ClientPage from "./page.client";
import { Endpoints } from "core/common_values";
import { apiFeeder } from "../../server_bridge";
import "../auth/page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const title = `${loader.main_locale.meta_title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;

    return {
        title,
        robots: { index: false, follow: false }
    };
}

export default async function ({ params, searchParams }) {
    params = await params;
    const loader = await installLoaderData({
        params,
        lang: 'override_password',
        pathname: `/override_password/${params.key}`,
        searchParams,
        stopRedirection: true
    });

    const { result } =
        await apiFeeder(Endpoints.getPasswordAction, {
            request: { body: { key: loader.params.key } }
        }).then(r => r.response);

    return (
        <ClientPage
            page_data={result}
            locale={loader.main_locale}
        />
    );
}