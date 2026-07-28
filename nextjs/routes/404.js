import { getLoaderDataSync, installLoaderData } from "../loader";

export default function (props) {
    setTimeout(() => {
        const loader = getLoaderDataSync();

        if (loader.has_root && !loader.has_install)
            installLoaderData({ stopRedirection: true });
    }, 0);

    return props.renderElement();
}