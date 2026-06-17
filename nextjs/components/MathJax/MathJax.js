"use client"

import { memo, useEffect, useRef } from "react";
import { appendScriptSrc } from "../../methods.client";
import LimitTask from "limit-task";

export const importMathjax = () =>
    appendScriptSrc({ src: process.env.NEXT_PUBLIC_MATH_JAX_SCRIPT_SRC });

const queue = LimitTask(70);

export default memo(function (props) {
    const ref = useRef();

    useEffect(() => {
        importMathjax().then(() => {
            queue(() =>
                window.MathJax.typesetPromise([ref.current])
            );
        });
    });

    return (
        <div
            {...props}
            ref={ref} />
    );
}, (p, n) =>
    (p.dangerouslySetInnerHTML || n.dangerouslySetInnerHTML)
        ? p.dangerouslySetInnerHTML.__html === n.dangerouslySetInnerHTML.__html :
        p.children === n.children
);

export const InitializeMathJax = () => {
    useEffect(() => {
        importMathjax().then(() => {
            window.MathJax.typesetPromise([...document.querySelectorAll('.post-math-jax-item')]);
        });
    }, []);

    return null;
}