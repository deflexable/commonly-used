import { default as NextLink } from "next/link";

/**
 * @param {import("next/link").LinkProps} props 
 * @returns {React.JSX.Element}
 */
export default function Link(props) {
    return <NextLink prefetch={false} {...props} />;
}