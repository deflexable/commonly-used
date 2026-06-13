"use client"

import ReactDOMServer from 'react-dom/server';
import { useEffect, useRef, useState } from 'react';

function linkify(text, replacer, WEB_BASE_URL) {
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    return text.replace(urlRegex, function (url = '') {
        let origin;

        try {
            origin = window.location.origin;
        } catch (e) { }

        const tik = replacer?.(url),
            blankPage = tik?.blank,
            openBlank = typeof blankPage === 'boolean' ? blankPage : !url.startsWith(origin || WEB_BASE_URL),
            mainURL = tik?.url || url || '';

        return tik?.disableLink ? url : `<a href="${mainURL}"${openBlank ? ' target="_blank"' : ''} onclick="event.stopPropagation()">${tik?.text || url}</a>`;
    });
}

export default function ({
    children,
    replacer,
    truncateLines,
    style,
    renderExpandComponent,
    expandToggleStyle,
    expandToggleClass = "thickBG",
    showMore_Less = ['Show More', 'Show Less'],
    WEB_BASE_URL,
    stringifyChild = true,
    ...restProps
}) {
    const shouldTruncate = !isNaN(truncateLines);

    if (!WEB_BASE_URL) WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_BASE_URL;

    const [expanded, setExpanded] = useState(),
        [expandable, setExpandable] = useState(),
        [fullHeight, setFullHeight] = useState(),
        [elapsedHeight, setElapsedHeight] = useState();

    const isToggling = useRef();

    useEffect(() => {
        if (!isNaN(fullHeight) &&
            !isNaN(elapsedHeight) &&
            !isToggling.current
            && shouldTruncate
        ) {
            const enlargable = fullHeight - 10 > elapsedHeight;

            setExpandable(enlargable);
            setExpanded(!enlargable);
        }
        isToggling.current = false;
    }, [fullHeight, elapsedHeight, shouldTruncate]);

    const isStringChild = stringifyChild || typeof children === 'string';

    const result = isStringChild ? linkify(typeof children === 'string' ? children : ReactDOMServer.renderToString(children), replacer, WEB_BASE_URL) : children;

    const resultProp = isStringChild ? { dangerouslySetInnerHTML: { __html: result } } : { children };

    return (
        <div style={{ position: 'relative' }}>
            {shouldTruncate ?
                <div style={{
                    height: '0px',
                    overflow: 'hidden',
                    zIndex: -3
                }}>
                    <div
                        ref={r => {
                            if (r) setFullHeight(r.clientHeight);
                        }}
                        {...restProps}
                        style={{
                            ...style,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical'
                        }}
                        {...resultProp}
                    />

                    <div
                        ref={r => {
                            if (r) setElapsedHeight(r.clientHeight);
                        }}
                        {...restProps}
                        style={shouldTruncate ? {
                            ...style,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            lineClamp: truncateLines,
                            WebkitLineClamp: truncateLines
                        } : style}
                        {...resultProp}
                    />
                </div> : null}

            <div
                {...restProps}
                style={shouldTruncate ? {
                    ...style,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    ...expanded ? undefined : {
                        lineClamp: truncateLines,
                        WebkitLineClamp: truncateLines
                    }
                } : style}
                {...resultProp}
            />
            {expandable ?
                <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0
                }}>
                    {renderExpandComponent?.(expanded) ||
                        <button
                            className={expandToggleClass}
                            style={{
                                ...style?.fontSize ? { fontSize: style.fontSize } : {},
                                padding: '2px 0px',
                                color: 'var(--dblue)',
                                border: 'none',
                                cursor: 'pointer',
                                ...expandToggleStyle
                            }}
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}>
                            {showMore_Less[expanded ? 1 : 0]}
                        </button>}
                </div> : null}
        </div>
    );
}