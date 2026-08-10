export function parseToTimezone(when, tz) {
    const str = new Date(when).toLocaleString("en", { timeZone: tz });

    const [date, time] = str.split(", ");

    const [month, day, year] = date.split("/").map(Number);

    let [clock, period] = time.split(" ");
    let [hour, minute, second] = clock.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return new Date(year, month - 1, day, hour, minute, second);
}

export function getATZ(tz) {
    try {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'short'
        });

        const parts = formatter.formatToParts(date);
        let result = '';

        for (const part of parts) {
            if (part.type === 'timeZoneName' || (result && part.type === 'literal')) {
                result += part.value;
            } else if (result) break;
        }

        if (!result) throw 'result not found';

        return result;
    } catch (_) {
        return tz;
    }
}