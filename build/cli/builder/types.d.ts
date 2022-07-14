export declare type ExecErrorOutput = {
    status: number;
    signal: null;
    output: Array<number>;
    pid: number;
    stdout: Uint8Array;
    stderr: Uint8Array;
};
