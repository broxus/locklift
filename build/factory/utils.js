"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountAbi = void 0;
const lodash_1 = require("lodash");
const account_1 = require("./account");
const validateAccountAbi = (inputAbi) => {
    const abi = inputAbi;
    const isValidAbi = (0, lodash_1.isEqual)(account_1.accountAbiBase.functions[0], abi?.functions?.find(el => el.name === "sendTransaction"));
    if (!isValidAbi) {
        throw new Error(`provided not valid abi ${JSON.stringify(abi, null, 4)}, this abi didn't pass constraint ${JSON.stringify(account_1.accountAbiBase, null, 4)}`);
    }
};
exports.validateAccountAbi = validateAccountAbi;
