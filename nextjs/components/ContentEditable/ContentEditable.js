import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const ContentEditable = forwardRef(({ dangerouslySetInnerHTML, onInput, ...extraProps }, ref) => {
    const { __html = '' } = dangerouslySetInnerHTML || {};

    const [html, setHtml] = useState(__html);

    const editableRef = useRef(),
        instantHtml = useRef(__html);

    useImperativeHandle(ref, () => editableRef.current);

    useEffect(() => {
        if (
            dangerouslySetInnerHTML &&
            __html !== instantHtml.current
        ) setHtml(__html);
    }, [__html]);

    return (
        <div
            {...extraProps}
            ref={editableRef}
            contentEditable={true}
            dangerouslySetInnerHTML={dangerouslySetInnerHTML && { __html: html }}
            onInput={e => {
                const { currentTarget: { innerHTML, innerText } } = e;
                instantHtml.current = innerHTML;
                onInput?.(e);

                if (
                    !innerText &&
                    innerHTML !== innerText
                ) {
                    e.currentTarget.innerHTML = innerText;
                } else if (!innerText.trim() && innerHTML === '<br>') {
                    e.currentTarget.innerHTML = '';
                }
            }} />
    );
});

export default ContentEditable;