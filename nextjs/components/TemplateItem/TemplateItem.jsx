import "./TemplateItem.css";

export const LoadingSpinner = ({ classes = '', style, spinnerStyle }) => {
    return (
        <div className={`template-item-loading-spinner${classes ? ' ' + classes : ''}`}
            style={style}>
            <div style={spinnerStyle} className="invertion" />
        </div>
    );
}

export const EmptyLogo = ({ classes = '', style, message = 'No Record Found', imageStyle, messageStyle }) => {
    return (
        <div className={`template-item-empty-logo${classes ? ' ' + classes : ''}`}
            style={style}>
            <div style={imageStyle} />
            <span>{message}</span>
        </div>
    );
}

export const PaginationTemplate = ({ classes = '', style }) => {
    return (
        <div className={`template-item-paging-con${classes ? ' ' + classes : ''}`}
            style={style}>
            <div className="invertion" />
        </div>
    );
}