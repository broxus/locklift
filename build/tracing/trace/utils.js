"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractContractInformation = exports.decoder = void 0;
const types_1 = require("../types");
var TargetType;
(function (TargetType) {
    TargetType["DST"] = "DST";
    TargetType["SRC"] = "SRC";
    TargetType["DEPLOY"] = "DEPLOY";
})(TargetType || (TargetType = {}));
const getCodeAndAddress = (msg, targetType) => {
    switch (targetType) {
        case TargetType.DST:
            return {
                address: msg.dst,
                codeHash: msg.dst_account?.code_hash,
            };
        case TargetType.SRC:
            return {
                address: msg.src,
                codeHash: msg.src_account?.code_hash,
            };
        case TargetType.DEPLOY:
            return {
                codeHash: msg.code_hash,
                address: msg.dst,
            };
    }
};
const decoder = async ({ msgBody, msgType, contract, initialType, }) => {
    const parsedAbi = JSON.parse(contract.contract.abi);
    switch (msgType) {
        case 0:
        case 1: {
            const isInternal = msgType === 0;
            return {
                decoded: await contract.contract
                    .decodeInputMessage({
                    internal: isInternal,
                    body: msgBody,
                    methods: parsedAbi.functions.map(el => el.name),
                })
                    .then(decoded => ({ method: decoded?.method, params: decoded?.input })),
                finalType: initialType,
            };
        }
        case 2: {
            const outMsg = await contract.contract.decodeOutputMessage({
                body: msgBody,
                methods: parsedAbi.functions.map(el => el.name),
            });
            if (outMsg) {
                return {
                    decoded: outMsg,
                    finalType: types_1.TraceType.FUNCTION_RETURN,
                };
            }
            return {
                decoded: await contract.contract
                    .decodeEvent({
                    body: msgBody,
                    events: parsedAbi.events.map(el => el.name),
                })
                    .then(decoded => ({ params: decoded?.data, method: decoded?.event })),
                finalType: types_1.TraceType.EVENT,
            };
        }
    }
};
exports.decoder = decoder;
const contractContractInformation = ({ msg, type, }) => ({
    [types_1.TraceType.DEPLOY]: getCodeAndAddress(msg, TargetType.DEPLOY),
    [types_1.TraceType.FUNCTION_CALL]: getCodeAndAddress(msg, TargetType.DST),
    [types_1.TraceType.EVENT]: getCodeAndAddress(msg, TargetType.SRC),
    [types_1.TraceType.EVENT_OR_FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC),
    [types_1.TraceType.BOUNCE]: getCodeAndAddress(msg, TargetType.DST),
    //TODO
    [types_1.TraceType.FUNCTION_RETURN]: getCodeAndAddress(msg, TargetType.SRC),
    [types_1.TraceType.TRANSFER]: getCodeAndAddress(msg, TargetType.DST),
}[type]);
exports.contractContractInformation = contractContractInformation;
