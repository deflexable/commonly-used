import { default as NextLink } from "next/link";

export default function Link(props) {
    return <NextLink prefetch={false} {...props} />;
}