import { useMemo } from "react";
import Link from "next/link";
import "./UserPhoto.css";

export default function ({ style, size, src, classes, imgProps, vip, href, target, ...props }) {
    const thisStyle = useMemo(() => size ? ({
        ...style,
        width: `${size}px`,
        height: `${size}px`
    }) : style, [style, size]);

    const renderImg = () => (
        <img src={src}
            className="user-photo-img"
            {...imgProps} />
    );

    if (href)
        return (
            <Link
                {...props}
                style={thisStyle}
                className={`user-photo-con${classes ? ' ' + classes : ''}`}
                href={href}
                onClick={e => { e.stopPropagation(); }}
                target={target}>
                {renderImg()}
            </Link>
        );

    return (
        <div
            {...props}
            style={thisStyle}
            className={`user-photo-con${classes ? ' ' + classes : ''}`}>
            {renderImg()}
        </div>
    )
}