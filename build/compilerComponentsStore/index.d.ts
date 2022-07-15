import { ComponentType } from "./constants";
export declare const getComponent: ({ version, component, }: {
    component: ComponentType;
    version: string;
}) => Promise<string>;
export declare function download(fileUrl: string, outputLocationPath: string): Promise<unknown>;
