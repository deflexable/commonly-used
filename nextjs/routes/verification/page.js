import { getLoaderData, installLoaderData } from "../../loader";
import ClientPage from "./page.client";
import "./page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const title = `${loader.locale.data.meta_title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;

    return {
        title,
        robots: { index: false, follow: false }
    };
}

export default async function ({ params, searchParams }) {
    const loader =
        await installLoaderData({
            params,
            lang: 'verification',
            pathname: '/verification',
            searchParams,
            enforceUser: true
        });

    return (
        <ClientPage
            locale={loader.main_locale}
            email={loader.user.email}
            entityOf={loader.user.entityOf}
        />
    );
}