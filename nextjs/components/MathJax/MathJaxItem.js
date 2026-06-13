
export default function ({ className, ...restProps }) {
    return <div className={`post-math-jax-item${className ? ' ' + className : ''}`} {...restProps} />;
}