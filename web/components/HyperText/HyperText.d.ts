import React from "react";

interface HyperTextProps extends HTMLDivElement {
    replacer?: (url?: string) => ({ blank: boolean, url?: string, text?: string, disableLink?: boolean; });
    truncateLines?: number;
    renderExpandComponent?: (expanded?: boolean) => HTMLDivElement;
    expandToggleStyle?: HTMLDivElement['style'];
    expandToggleClass?: string;
}

export default class HyperText extends React.Component<HyperTextProps> { }