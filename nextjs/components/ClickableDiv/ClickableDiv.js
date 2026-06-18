

export function makeClickable(Item, props) {
    return (
        <Item
            tabIndex={0}
            role="button"
            onKeyDown={e => {
                if (!e.altKey && !e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.click();
                }
            }}
            {...props} />
    );
}

/**
 * @param {React.ComponentProps<'div'>} props
 * 
 * @returns {React.JSX.Element}
 */
export default function ClickableDiv(props) {
    return makeClickable('div', props);
}

/**
 * @param {React.ComponentProps<'span'>} props
 * 
 * @returns {React.JSX.Element}
 */
export function ClickableSpan(props) {
    return makeClickable('span', props);
}

/**
 * @param {React.ComponentProps<'img'>} props
 * 
 * @returns {React.JSX.Element}
 */
export function ClickableImg(props) {
    return makeClickable('img', props);
}

/**
 * @param {React.ComponentProps<'b'>} props
 * 
 * @returns {React.JSX.Element}
 */
export function ClickableBold(props) {
    return makeClickable('b', props);
}

/**
 * @param {React.ComponentProps<'i'>} props
 * 
 * @returns {React.JSX.Element}
 */
export function ClickableItalic(props) {
    return makeClickable('i', props);
}