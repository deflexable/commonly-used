import { AppState } from "react-native";
import { auth } from './client_server';
import NativeMosquitoTransport from 'react-native-mosquito-transport/src/NativeMosquitoTransport';

const globalTiming = { value: 0, uptime: undefined, promise: undefined };
const userTiming = { value: 0, uptime: undefined, promise: undefined };

export const getBusy = (withUser) => {
    const obj = withUser ? userTiming : globalTiming;
    const prevPromise = obj.promise;

    const promise = (async () => {
        if (prevPromise !== undefined) await prevPromise.catch(() => null);

        const newUptime = await NativeMosquitoTransport.getSystemUptime();

        if (obj.uptime !== undefined) {
            obj.value += (newUptime - obj.uptime);
            obj.uptime = AppState.currentState === 'active' ? newUptime : undefined;
        }
        if (obj.promise === promise) obj.promise = undefined;

        return { time: obj.value, newUptime };
    })();

    return obj.promise = promise;
}

getBusy().then(v => {
    globalTiming.uptime = v.newUptime;
});

let userExists;
auth().listenAuth(async user => {
    const { newUptime } = await getBusy(true);
    userTiming.uptime = ((userExists = user?.authVerified) && AppState.currentState === 'active') ? newUptime : undefined;
});

AppState.addEventListener('change', async state => {
    [false, true].forEach(async withUser => {
        const { newUptime } = await getBusy(withUser);
        if (withUser) {
            userTiming.uptime = (userExists && state === 'active') ? newUptime : undefined;
        } else {
            globalTiming.uptime = state === 'active' ? newUptime : undefined;
        }
    });
});