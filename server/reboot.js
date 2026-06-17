import { exec } from "child_process";

export default (password) =>
    new Promise((resolve, reject) => {
        exec(`echo "${password}" | sudo -S reboot`, (error, stdout, stderr) => {
            if (error) {
                reject(`Reboot failed: ${error.message}`);
                return;
            }
            resolve('Server is rebooting...');
        });
    });