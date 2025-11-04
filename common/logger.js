
const MAX_LOGS_SIZE = 1024 * 1024 * 3;

export const TerminalContent = [];
export let TerminalContentSize = 0;

const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

const dispatchMessage = (data) => {
    data = `${data}`;
    TerminalContent.push(data);

    if ((TerminalContentSize += data.length) > MAX_LOGS_SIZE) {
        console.clear();
    } else {
        // Notify listeners
    }
}

process.stdout.write = function (chunk, encoding, callback) {
    dispatchMessage(chunk);
    originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
};

process.stderr.write = function (chunk, encoding, callback) {
    dispatchMessage(chunk);
    originalStderrWrite.call(process.stderr, chunk, encoding, callback);
};

const originalClear = console.clear;
console.clear = function () {
    TerminalContent = ['Console was cleared.'];
    originalClear(...[...arguments]);
};