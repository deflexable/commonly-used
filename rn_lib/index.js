
import { default as bbx_rn_lib } from "./NativeBbxCommonlyUsed.js";
export default bbx_rn_lib;

const mcode = bbx_rn_lib.getUniqueId();

export const getMachineCode = async () => {
    return mcode;
}