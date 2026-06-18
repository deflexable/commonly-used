
/**
 * @param {React.ComponentProps<'div'>} props
 * 
 * @returns {React.JSX.Element}
 */
export default function ({ className, ...restProps }) {
    return <div className={`post-math-jax-item${className ? ' ' + className : ''}`} {...restProps} />;
}