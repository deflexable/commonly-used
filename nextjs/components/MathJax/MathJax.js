"use client"

import { memo, useEffect, useRef } from "react";
import { appendScriptSrc } from "../../methods.client";

export const importMathjax = () =>
    appendScriptSrc({ src: process.env.NEXT_PUBLIC_MATH_JAX_SCRIPT_SRC });

export default memo(function ({ value }) {
    const ref = useRef();

    useEffect(() => {
        importMathjax().then(() => {
            window.MathJax.typesetPromise([ref.current]);
        });
    }, [value]);

    return (
        <div ref={ref}
            dangerouslySetInnerHTML={{ __html: value }} />
    );
}, (p, n) => p.value === n.value);

export const InitializeMathJax = () => {
    useEffect(() => {
        importMathjax().then(() => {
            MathJax.typesetPromise([...document.querySelectorAll('.post-math-jax-item')]);
        });
    }, []);

    return null;
}