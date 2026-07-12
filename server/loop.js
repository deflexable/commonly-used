import { one_day } from "../common/timing";

export const runDailyLoop = (callback) => {

    const dailyLoop = async (auto) => {
        const today = new Date();
        const milisSinceMorning = (today.getHours() * 3600000) + (today.getMinutes() * 60000) + (today.getSeconds() * 1000) + today.getMilliseconds();
        const nextLoopMillis = one_day - milisSinceMorning;

        setTimeout(() => {
            dailyLoop(true);
        }, nextLoopMillis);
        if (!auto) return;
        callback();
    }

    dailyLoop();
}