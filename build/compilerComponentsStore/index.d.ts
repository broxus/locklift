import { ComponentType } from "./constances";
export declare const getComponent: ({ version, component, }: {
    component: ComponentType;
    version: string;
}) => Promise<string>;
