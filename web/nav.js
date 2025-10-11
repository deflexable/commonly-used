import { useLocation, useNavigate, useMatches } from "@remix-run/react";
import { useRef } from "react";

export const useLastLoaderData = () => {
    const rmatch = useMatches();
    return rmatch.slice(-1)[0].data;
}

export const useUniquePageKey = () => {
    const loc = useLocation();
    const lastKey = useRef(loc.key);

    if (loc.key !== 'default') lastKey.current = loc.key;

    return `${lastKey.current}::${loc.pathname}${loc.search}`;
}

export const useBackNavigate = () => {
    const navigate = useNavigate();

    return (route) => {
        const canGoBack = history.length > 1;
        if (canGoBack) navigate(`..${route}`, { replace: true });
        else navigate(route);
    }
}