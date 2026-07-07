import { getLoaderData, installLoaderData } from "../../loader";
import "./page.css";

export async function generateMetadata() {
    const loader = await getLoaderData();
    const title = `${loader.main_locale.meta_title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;

    return {
        title,
        robots: { index: false, follow: false }
    };
}

export default async function ({ searchParams, params }) {
    const loader =
        await installLoaderData({
            params,
            lang: 'suspended',
            pathname: '/suspended',
            searchParams,
            enforceUser: true
        });

    return (
        <div className="suspended-body-heighter">
            <div className="suspended-body-cont">
                <img src={'/assets/user_blocked.png'} />
                <h2>{loader.main_locale.suspended_title}</h2>
                <small>
                    {loader.main_locale.suspended_des}
                </small>
            </div>
        </div>
    );
}