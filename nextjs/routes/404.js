import { getLoaderDataSync, installLoaderData } from "../loader";

export default function (props) {
    const loader = getLoaderDataSync();

    if (loader.has_root && !loader.has_install)
        installLoaderData({ stopRedirection: true });

    return props.renderElement();
}