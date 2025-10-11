import React from "react";

export const arrowStyle: { rel: 'stylesheet', href: string };

interface ArrowSliderProps extends HTMLDivElement {
    leftArrowComponent: HTMLElement;
    rightArrowComponent: HTMLElement;
    scrollerClass?: HTMLElement['className'];
}

export default class ContentEditable extends React.Component<ArrowSliderProps> { }