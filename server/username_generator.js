import { DbPath } from "core/common_values.js";
import { randomString } from "../common/methods.js";

const MAX_USERNAME_GENERATOR = 99;
const ProcessingMentionName = {};

export const getSuitableUsername = async (name = '', collection) => {
    name = name.trim().toLowerCase();
    if (!name) return randomString(9);

    const k = name.split(' ');
    const isNormal = k.length === 2;
    const nameSplits = [
        k.join('_'),
        k.join('_') + '_',
        isNormal ? k[0] : undefined,
        isNormal ? k[0] + '_' : undefined,
        isNormal ? k[1] : undefined,
        isNormal ? k[1] + '_' : undefined,
        `${k.join('_')}_${randomString(5)}`,
    ].filter(v => v?.trim());

    try {
        for (let a = 0; a < nameSplits.length; a++) {
            for (let i = 0; i < MAX_USERNAME_GENERATOR; i++) {
                let testCase = `${nameSplits[a]}${i ? i + 1 : ''}`;

                if (!ProcessingMentionName[testCase]) {
                    ProcessingMentionName[testCase] = true;
                    const f = await collection(DbPath.users).findOne({ at: testCase });

                    delete ProcessingMentionName[testCase];
                    if (!f) return testCase;
                }
            }
        }
    } catch (e) { }
    return randomString(9);
};