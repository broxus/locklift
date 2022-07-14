import { LockliftConfig } from "../../config";
export declare type BuilderConfig = {
    includesPath?: string;
    compilerPath: string;
    linkerLibPath: string;
    linkerPath: string;
    externalContracts: LockliftConfig["compiler"]["externalContracts"];
};
export declare class Builder {
    private readonly config;
    private options;
    private nameRegex;
    private docRegex;
    constructor(config: BuilderConfig, options: any);
    buildContracts(): Promise<boolean>;
    buildDocs(): boolean;
    private parseDocs;
    private getContractsTree;
    private log;
}
