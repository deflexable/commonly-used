import "./RadioButton.css";

export const RadioButton = ({ isSelected, size, style, buttonStyle, themeColor, themeColorFilter, isCheckBox, className }) => {
    if (size)
        buttonStyle = {
            width: `${size}px`,
            height: `${size}px`,
            ...buttonStyle
        };

    return (
        <div style={style}>
            <div className={`radio-button-comp${isSelected ? '' : ' radio-button-blurred'}${(!isSelected && className) ? ' ' + className : ''}`}
                style={{
                    ...themeColor ? { borderColor: themeColor } : {},
                    ...buttonStyle,
                    ...isCheckBox ? { borderRadius: '3px' } : {}
                }}>
                {isSelected ?
                    isCheckBox ?
                        <span style={{
                            ...themeColorFilter ? { filter: themeColorFilter } : {},
                            backgroundImage: 'url(/assets/mark.png)'
                        }} /> :
                        <div style={themeColor ? { backgroundColor: themeColor } : {}} /> : null}
            </div>
        </div>
    );
}