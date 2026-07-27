import { getLoaderData, installLoaderData } from "../loader";
import ClientPage from "./unauthorized.client";

export default async function () {
    const loader =
        (loader.has_root && !loader.has_install)
            ? installLoaderData({ stopRedirection: true })
            : getLoaderData();

    const locale =
        await loader
            .then(v => v.locale.data)
            .catch(() => null);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            textAlign: 'center'
        }}>
            <div style={{ width: '70px', height: '70px', backgroundImage: 'url(/assets/loading.gif)' }}
                className="invertion" />
            <div style={{ marginTop: '7px' }}>
                {locale?.redirecting_please_wait}...
            </div>
            <ClientPage />
        </div>
    );
}