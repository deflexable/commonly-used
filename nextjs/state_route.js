import { useEffect, useMemo, useRef } from "react";
import { APP_STATES } from "./scope";
import { isBrowser } from "./is_browser";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * @type {(init_restorables?: any) => ({ restoreData: {[key: string]: any}, wasRestore: boolean })}
 */
export const useRouteState = (init_restorables) => {
    const unmounted = useRef();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const route = `${pathname}?${searchParams}`;

    const wasRestore = useMemo(() => {
        if (isBrowser()) {
            if (APP_STATES.routes[route]) return true;
            APP_STATES.routes[route] = {
                state: { ...init_restorables },
                scrollY: window.scrollY
            };
            return false;
        }
    }, [init_restorables]);

    useEffect(() => {
        unmounted.current = false;

        let timer;
        if (wasRestore) {
            const { scrollY } = APP_STATES.routes[route];
            window.scroll({ top: scrollY, behavior: 'instant' });
            timer = setTimeout(() => {
                window.scroll({ top: scrollY, behavior: 'instant' });
            }, 300);
        }

        const listener = () => {
            APP_STATES.routes[route].scrollY = window.scrollY;
            clearTimeout(timer);
        }
        window.addEventListener('scroll', listener);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', listener);
            unmounted.current = true;
        }
    }, []);

    return {
        restoreData: useMemo(() => new Proxy({}, {
            get: (_, n) => {
                if (isBrowser()) return APP_STATES.routes?.[route]?.state?.[n];
                return init_restorables?.[n];
            },
            set: (_, n, v) => {
                if (!isBrowser()) throw 'cannot set route state on the server';
                if (unmounted.current) throw `cannot set "${n}" as route(${route}) state instance has been destroyed`;
                APP_STATES.routes[route].state[n] = v;
                return true;
            }
        }), []),
        wasRestore
    };
}