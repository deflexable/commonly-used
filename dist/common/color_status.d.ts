export function getColorLuminance(color: string): {
    status: "too_light" | "too_dark" | "normal_brightness";
    value: number;
};
export function getColorfulness(color: string): {
    status: "neutral_or_grayish" | "highly_colorful" | "moderately_colorful";
    value: number;
};
