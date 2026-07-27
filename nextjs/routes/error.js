import { useEffect } from "react";

export default function ClientError({ error, RenderedElement }) {
    let title, des;

    if (error?.name) {
        title = `${error.environmentName || ''} ${error.name}`.trim();
    } else title = 'Unexpected Error';

    if (error?.message) {
        des = `${error.message}`;
    } else des = `${error}`;

    if (error?.digest) {
        des = des.concat(`, Digest: ${error?.digest}`);
    }

    useEffect(() => {
        fetch(process.env.NEXT_PUBLIC_SSO_AUTH_URL.concat('/log_critical_error'), {
            method: 'POST',
            body: JSON.stringify({ title, des, href: location.href }),
            keepalive: false
        });
    }, []);

    return RenderedElement({ title, des });
}