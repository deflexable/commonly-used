"use client"

import { useEffect } from "react";
import "./scroll_blocker.css";

const block_map = new Map();

export const useBodyScrollBlocker = (block, query) => {

    useEffect(() => {
        const ref = typeof query === 'string' ? document.querySelector(query) : (query || document.body);

        if (!block) {
            if (!block_map.get(query)?.value)
                ref.classList.remove('element-scroll-y-blocker');
            return;
        }
        let obj;

        if (block_map.has(query)) {
            obj = block_map.get(query);
        } else {
            obj = { value: 0 };
            block_map.set(query, obj);
        }

        ++obj.value;

        ref.classList.add('element-scroll-y-blocker');
        return () => {
            if (!--obj.value) {
                ref.classList.remove('element-scroll-y-blocker');
                block_map.delete(query);
            }
        };
    }, [!!block]);
};