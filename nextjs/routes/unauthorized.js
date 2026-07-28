import { getLoaderData, getLoaderDataSync, installLoaderData } from "../loader";
import ClientPage from "./unauthorized.client";

export default async function () {
    const nowLoader = getLoaderDataSync();
    const o = {};

    const loader = (
        (nowLoader.has_root && !nowLoader.has_install)
            ? Promise.reject(o)
            : getLoaderData()
    ).catch(e =>
        installLoaderData({
            stopRedirection: true,
            ignoreSettle: e !== o
        })
    );

    const locale =
        await loader
            .then(v => v.locale.data)
            .catch(_ => null);

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