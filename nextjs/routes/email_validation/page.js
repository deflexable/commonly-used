import { getLoaderData, installLoaderData } from "../../loader";
import ClientPage from "./page.client";
import { Endpoints } from "core/common_values";
import { apiFeeder } from "../../server_bridge";
import "../auth/page.css";
import "./page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const title = `${loader.main_locale.meta_title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;

    return {
        title,
        robots: { index: false, follow: false }
    };
}

export default async function ({ params, searchParams, supportLink }) {
    params = await params;
    const loader = await installLoaderData({
        params,
        lang: 'email_validation',
        pathname: `/email_validation/${params.token}`,
        searchParams,
        stopRedirection: true
    });

    const { params: { token }, url_instance, ip_address, main_locale } = loader;
    const initResult =
        await apiFeeder(Endpoints.validateEmail, {
            request: {
                cip: ip_address,
                ip: ip_address,
                body: { token, code: url_instance.searchParams.get('req_code') }
            }
        }).then(r => r.response);

    return (
        <ClientPage
            supportLink={supportLink}
            page_data={{ token, initResult }}
            locale={main_locale}
        />
    );
}