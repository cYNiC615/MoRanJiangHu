declare module '*?raw' {
    const content: string;
    export default content;
}

interface ImportMetaEnv {
    readonly DEV?: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

type KVNamespace = {
    get: <T = unknown>(...args: any[]) => Promise<T | null>;
    put: (...args: any[]) => Promise<any>;
    delete?: (...args: any[]) => Promise<any>;
    list: (...args: any[]) => Promise<{ keys: any[]; list_complete?: boolean; cursor?: string }>;
};

type R2ObjectBody = {
    json: <T = unknown>() => Promise<T>;
    text?: () => Promise<string>;
};

type R2Bucket = {
    get: (...args: any[]) => Promise<R2ObjectBody | null>;
    put: (...args: any[]) => Promise<any>;
    delete?: (...args: any[]) => Promise<any>;
    list: (...args: any[]) => Promise<{ objects: any[]; truncated?: boolean; cursor?: string }>;
};
