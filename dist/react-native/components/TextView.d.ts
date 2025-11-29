export default TextView;
/**
 * @type {import('react').FC<import('react-native').TextProps>}
 */
export const DynamicTextView: import("react").FC<any>;
export type TextExtraProps = {
    forceColor?: string;
    invertColor?: boolean;
    forceSize?: number;
};
/**
 * @typedef {object} TextExtraProps
 * @property {string} [forceColor]
 * @property {boolean} [invertColor]
 * @property {number} [forceSize]
 */
/**
 * @type {React.FC<React.ComponentProps<typeof import('react-native').Text> & TextExtraProps>}
 */
declare const TextView: React.FC<React.ComponentProps<typeof import("react-native").Text> & TextExtraProps>;
