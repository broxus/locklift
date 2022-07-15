import { ComponentType } from "./constants";
export declare const getPathToVersion: ({ component, version }: {
    component: ComponentType;
    version: string;
}) => string;
export declare const isComponentVersionExists: ({ version, component, }: {
    version: string;
    component: ComponentType;
}) => boolean;
