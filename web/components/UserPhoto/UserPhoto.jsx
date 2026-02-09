import { Link } from "@remix-run/react";
import { useLangLink } from "bbx-commonly-used/web/langy";

export default function ({ style, size, src, classes, imgProps, vip, href, target }) {
    if (size) style = { ...style, width: `${size}px`, height: `${size}px` };
    const langify = useLangLink();

    const renderImg = () => (
        <img src={src}
            style={{
                borderRadius: '50%',
                objectFit: 'cover',
                width: '100%',
                height: '100%'
            }}
            {...imgProps} />
    )

    if (href)
        return (
            <Link style={{ position: 'relative', display: 'block', ...style }}
                role="link"
                className={classes}
                to={langify(href)}
                onClick={e => { e.stopPropagation() }}
                target={target}>
                {renderImg()}
            </Link>
        );

    return (
        <div style={{ position: 'relative', ...style }}
            className={classes}>
            {renderImg()}
        </div>
    )
}