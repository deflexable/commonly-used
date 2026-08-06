"use client"

import { default as NextLink } from "next/link";
import { useSearchParams } from "next/navigation";
import { mutateLink } from "./link-middleware";

/**
 * @type {typeof NextLink}
 */
const Link = (props) => {
    const search = useSearchParams();
    const mutatedHref = mutateLink(props.href, search);

    if (mutatedHref) {
        props = {
            ...props,
            href: mutatedHref
        };
    }

    return <NextLink prefetch={false} {...props} />;
}

export default Link;