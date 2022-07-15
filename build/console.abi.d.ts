export declare const consoleAbi: {
    readonly "ABI version": 2;
    readonly version: "2.2";
    readonly header: readonly ["time"];
    readonly functions: readonly [{
        readonly name: "log";
        readonly inputs: readonly [{
            readonly name: "_log";
            readonly type: "string";
        }];
        readonly outputs: readonly [];
    }, {
        readonly name: "constructor";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
    }];
    readonly data: readonly [];
    readonly events: readonly [];
    readonly fields: readonly [{
        readonly name: "_pubkey";
        readonly type: "uint256";
    }, {
        readonly name: "_timestamp";
        readonly type: "uint64";
    }, {
        readonly name: "_constructorFlag";
        readonly type: "bool";
    }];
};
export declare type ConsoleAbi = typeof consoleAbi;
