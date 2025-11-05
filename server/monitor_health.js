import { API_BASE_URL } from "core/env.js";
import { randomString } from "core/methods.js";

const SERVER_FAULTS = {
    DISCONNECTED: 'DISCONNECTED',
    CRASHED: 'CRASHED',
    ERROR: 'ERROR'
};

export default function (collection) {
    const logServerHealth = ({ machine, message, fault }) => {
        return collection('serverHealthLogs').insertOne({
            _id: randomString(30),
            machine,
            fault,
            text: message,
            date: Date.now(),
            domain: API_BASE_URL
        });
    };

    const stringifyContent = v => {
        try {
            return JSON.stringify(v);
        } catch {
            return String(v);
        }
    }

    process.on('uncaughtException', (err, origin) => {
        console.error('uncaughtException err:', err, ' origin:', origin);

        logServerHealth({
            message: `Server encounters an uncaughtExecption with error:${stringifyContent(err)} and origin:${stringifyContent(origin)}`,
            fault: SERVER_FAULTS.ERROR
        });
    });

    process.on('unhandledRejection', reason => {
        console.error('unhandledRejection reason:', reason);

        logServerHealth({
            message: `Server encounters an unhandledRejection with reason:${stringifyContent(reason)}`,
            fault: SERVER_FAULTS.ERROR
        });
    });

    process.on('beforeExit', code => {
        logServerHealth({
            message: `Server crashed unexpectedly with code:${stringifyContent(code)}`,
            fault: SERVER_FAULTS.CRASHED
        });
    });

    process.on('exit', code => {
        console.log('Node.js process exiting with code:', code);
    });
}