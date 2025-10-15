
export const capitalize = (t) => typeof t === 'string' ? `${t.substring(0, 1).toUpperCase()}${t.substring(1).toLowerCase()}` : t;

export const getWeekDate = () => {
    const startDate = new Date(),
        endDate = new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    return [
        startDate.getDate(),
        endDate.getDate()
    ];
};

export const isNothing = (o) => o === undefined || o === null;

export function shuffleArray(array = []) {
  const arr = array.slice();
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
};

export const interpolate = (x, [y1, x1], [y2, x2]) => {
    return y1 + ((x - x1) * ((y2 - y1) / (x2 - x1)));
};

export const convertByteToWord = (bytes) => {
    if (bytes < 1000) {
        return bytes + ' byte' + (bytes > 1 ? 's' : '');
    }
    if (bytes < 1000000) {
        let kb = bytes / 1024;
        return (kb < 10 ? roundToDecimalPlace(kb) : Math.round(kb)) + 'KB';
    }
    if (bytes < 1000000000) {
        let mb = bytes / 1048576; // (1024 * 1024);
        return (mb < 10 ? roundToDecimalPlace(mb) : Math.round(mb)) + 'MB';
    }
    let gb = bytes / 1073741824; // (1024 * 1024 * 1024);
    return (gb < 10 ? roundToDecimalPlace(gb) : Math.round(gb)) + 'GB';
};

export const wait = (ms = 1000) => new Promise(resolve => {
    setTimeout(resolve, ms);
});

export const formatTimeCounter = (ms = 0) => {
    if (!ms || Math.floor(ms) === 0) return '00:00';
    // 1- Convert to seconds:
    let seconds = ms / 1000;
    // 2- Extract hours:
    const hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return (hours ? bomb(Math.round(hours)) + ":" : '') + bomb(Math.round(minutes)) + ":" + bomb(Math.round(seconds));
};

const bomb = s => ((s + '').length > 1 ? s : ('0' + s));

export const randomArrayItem = (arr = []) => arr[getRandomNumber(arr.length - 1, 0)];

export const getRandomNumber = (max = 70, min = 0) => {
    return Math.round(((max - min) * Math.random()) + min);
};

export const randomString = (length = 20, number = true, capLetter = true, smallLetter = true) => {
    const randomChars = `${capLetter ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : ''}${number ? '0123456789' : ''}${smallLetter ? 'abcdefghijklmnopqrstuvwxyz' : ''}`;
    const indexSize = randomChars.length - 1;

    return Array(length).fill(0).map(() => randomChars.charAt(Math.round(Math.random() * indexSize))).join('');
};

export const shortenLongNumber = (number) => {
    number = number || 0;
    number = number * 1;

    if (number < 999) return number + '';
    if (number < 999999) return Math.floor(number / 1000) + "K";
    if (number < 999999999) return Math.floor(number / 1000000) + "M";
    return Math.floor(number / 1000000000) + "B";
};

export const milisToTime = (ms) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}min`;
    const m = (ms % 3600000) / 60000;
    return `${Math.floor(ms / 3600000)}hr${m >= 1 ? ' ' + Math.round(m) + 'min' : ''}`;
};

export const hourMinuteStructure = (ms) => {
    if (ms < 3600000) return [0, Math.round(ms / 60000)];
    const m = (ms % 3600000) / 60000;
    return [Math.floor(ms / 3600000), m >= 1 ? 0 : Math.round(m)];
};

export const numberWithCommas = (n) => {
    var parts = n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
};

export const roundToDecimalPlace = (number, decimalPlace = 1) => (Math.round(((number) + Number.EPSILON) * Math.pow(10, decimalPlace)) / Math.pow(10, decimalPlace));

export const joinPath = (...paths) => paths.length === 1 ? paths[0] : paths.map((v, i, a) =>
    (!i ? trimEnd : i === a.length - 1 ? trimStart : trimChar)(v, '/')
).join('/');

export const trimChar = (string, char) => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters in `char`
    const regex = new RegExp(`^${escapedChar}+|${escapedChar}+$`, 'g');
    return string.replace(regex, '');
};

const trimStart = (string, char) => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
    const regex = new RegExp(`^${escapedChar}+`, 'g'); // Match `char` at the start
    return string.replace(regex, '');
};

const trimEnd = (string, char) => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
    const regex = new RegExp(`${escapedChar}+$`, 'g'); // Match `char` at the end
    return string.replace(regex, '');
};

export function haversineDistance([lat1, lon1], [lat2, lon2]) {
    const toRad = deg => deg * (Math.PI / 180);

    const R = 6371; // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export function getExtension(filePath) {
    if (typeof filePath !== 'string') return;

    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1) return; // no extension

    return filePath.slice(lastDot + 1).toLowerCase();
};