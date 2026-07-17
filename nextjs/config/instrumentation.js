
const niceSerialize = (o) => {
    try {
        return JSON.parse(JSON.stringify(o));
    } catch (error) {
        return { errorable: `${o}` };
    }
}

export async function onRequestError(error, request, context) {

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { join, resolve } = await import("node:path");
        const { mkdir, writeFile } = await import('node:fs/promises');

        const ERROR_LOG_DIR = resolve(process.cwd(), './.rendered-error');

        await mkdir(ERROR_LOG_DIR, { recursive: true }).finally(() => {
            const data = {
                date: new Date().toLocaleString?.(),
                time: Date.now(),
                error: niceSerialize({ ...error }),
                request: niceSerialize({ ...request }),
                context: niceSerialize({ ...context })
            };

            if (error?.message) data.errorMessage = niceSerialize(error?.message);

            return writeFile(join(ERROR_LOG_DIR, `${Date.now()}.json`), JSON.stringify(data), 'utf8');
        });
    }
}