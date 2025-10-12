import { useMemo, useRef } from "react"
import { StyleSheet, useWindowDimensions } from "react-native";

function isObject(o) {
    if (typeof o !== 'object' || o === null) return false;
    return Object.prototype.toString.call(o) === '[object Object]'
        && Object.getPrototypeOf(o) === Object.prototype;
}

export class CustomValue {
    constructor(map) {
        this.mapf = map;
    }
}

/**
 * @template T
 * @param {T} init
 * @param {{ prioritiseMap: string | string[] }} options
 * @returns {{ format: <U>(style: U) => U; styles: T; windowWidth: number; windowHeight: number; }}
 */
export const useCustomStyle = (init, options) => {
    const { width, height, fontScale, scale } = useWindowDimensions();
    const refactor = useRef();

    const transformField = (k, v) => {
        let { prioritiseMap } = options || {};

        if (v instanceof CustomValue && prioritiseMap !== undefined) {
            if (!Array.isArray(prioritiseMap)) prioritiseMap = [prioritiseMap];

            const dex = prioritiseMap.findIndex(p => p in v.mapf);
            if (dex !== -1) return [k, v.mapf[prioritiseMap[dex]]];
        } else if (DynamicNumerals.includes(k)) {
            // TODO:
        }
        return [k, v];
    }

    refactor.current = (style) => {
        if (style) {
            const argArray = Array.isArray(style);
            const r = (argArray ? style : [style]).map(v => {
                if (isObject(v)) {
                    v = Object.fromEntries(
                        Object.entries(v).map(([k, v]) =>
                            transformField(k, v)
                        )
                    );
                }
                return v;
            });
            return argArray ? r : r[0];
        }
        return style;
    }

    return useMemo(() => {
        if (options?.prioritiseMap !== undefined) {
            let { prioritiseMap } = options || {};
            (Array.isArray(prioritiseMap) ? prioritiseMap : [prioritiseMap]).forEach(e => {
                if (typeof e !== 'string')
                    throw `"prioritiseMap" must be a string or array of string but got ${e}`;
            });
        }
        let refactorStyle;
        if (init) {
            refactorStyle = {};
            const addStyle = (k, v) => {
                if (!refactorStyle[k]) refactorStyle[k] = [];
                refactorStyle[k].push(refactor.current(v));
            }
            const after_fields = {};
            const operator_list = ['<=', '<', '>=', '>', '=', '==', '!='];
            const custom_fields = ['@screen-width', '@screen-height'];

            Object.entries(init).forEach(([k, v]) => {
                if (k.startsWith('@')) {
                    let choosenField;
                    if (choosenField = custom_fields.find(v => k.startsWith(v))) {
                        const offset = choosenField.length;
                        const opOffset = k[offset + 1] === '=' ? 2 : 1;

                        const [operator, value] = [k.slice(offset, offset + opOffset), k.slice(offset + opOffset) * 1];
                        if (!operator_list.includes(operator))
                            throw `unknown style operator:${operator}`;
                        if (
                            typeof value !== 'number' ||
                            value < 0 ||
                            isNaN(value) ||
                            !isFinite(value)
                        ) throw `${choosenField} must have a positive number as it value`;

                        if (!after_fields[operator]) after_fields[operator] = [];

                        after_fields[operator].push([value, choosenField, v]);
                    } else throw `unknown operator field ${k}`;
                } else addStyle(k, v);
            });

            operator_list.forEach(op => {
                if (after_fields[op]) {
                    after_fields[op].forEach(([value, field, obj]) => {
                        const operand = [width, height][custom_fields.indexOf(field)];
                        if ([
                            operand <= value,
                            operand < value,
                            operand >= value,
                            operand > value,
                            operand === value,
                            operand === value,
                            operand != value,
                        ][operator_list.indexOf(op)]) {
                            Object.entries(obj).forEach(([k, v]) => {
                                addStyle(k, v);
                            });
                        }
                    });
                }
            });
            refactorStyle = Object.fromEntries(
                Object.entries(refactorStyle).map(([k, v]) => [k, StyleSheet.flatten(v)])
            );
        }

        return {
            format: s => refactor.current(s),
            styles: refactorStyle,
            windowWidth: width,
            windowHeight: height
        };
    }, [options, init, width, height, fontScale, scale]);
};

const DynamicNumerals = [
    'width',
    'height',
    'maxWidth',
    'maxHeight',
    'minWidth',
    'minHeight',
    'borderWidth',
    'top',
    'left',
    'bottom',
    'right',
    'start',
    'end',
    'margin',
    'marginStart',
    'marginEnd',
    'marginTop',
    'marginBottom',
    'marginRight',
    'marginHorizontal',
    'marginVertical',
    'marginLeft',
    'paddingHorizontal',
    'padding',
    'paddingBottom',
    'paddingTop',
    'paddingStart',
    'paddingEnd',
    'paddingLeft',
    'paddingRight',
    'paddingVertical'
];