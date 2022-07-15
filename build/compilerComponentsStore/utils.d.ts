import { ComponentType } from "./constants";
export declare const getGzFileName: (fileName: string) => string;
export declare const replaceDots: (arg: string) => string;
export declare const downloadLinks: Record<ComponentType, (arg: {
    version: string;
}) => string>;
export declare const fileNames: Record<ComponentType, (arg: {
    version: string;
}) => string>;
export declare const executableFileName: Record<ComponentType, (arg: {
    version: string;
}) => string>;
export declare const getSupportedVersions: ({ component }: {
    component: ComponentType;
}) => Promise<Array<string>>;
