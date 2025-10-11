
export default function ({ isSelected, size, style, buttonStyle, themeColor, themeColorFilter, isCheckBox, isDarkMode }) {

    if (size)
        buttonStyle = {
            width: `${size}px`,
            height: `${size}px`,
            ...buttonStyle
        };

    return (
        <div style={style}>
            <div className='radio-button-comp'
                style={{
                    ...(isSelected ? undefined :
                        {
                            borderColor: isDarkMode ? 'var(--white250Opacity)' : 'var(--lightBorder)'
                        }),
                    ...(themeColor ? { borderColor: themeColor } : {}),
                    ...buttonStyle,
                    ...isCheckBox ? { borderRadius: '3px' } : {}
                }}>
                {isSelected ?
                    isCheckBox ? <span style={themeColorFilter ? { filter: themeColorFilter } : {}} /> :
                        <div style={themeColor ? { backgroundColor: themeColor } : {}} /> : null}
            </div>
        </div>
    )
}