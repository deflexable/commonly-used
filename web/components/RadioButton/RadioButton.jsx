import { useDarkMode } from "bbx-commonly-used/web/theme_helper";
import { Mark } from "website/app/utils/asset_map.js";

export const RadioButton = ({ isSelected, size, style, buttonStyle, themeColor, themeColorFilter, isCheckBox }) => {
    const isDarkMode = useDarkMode();
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
                    isCheckBox ?
                        <span style={{
                            ...themeColorFilter ? { filter: themeColorFilter } : {},
                            backgroundImage: `url(${Mark})`
                        }} /> :
                        <div style={themeColor ? { backgroundColor: themeColor } : {}} /> : null}
            </div>
        </div>
    );
}