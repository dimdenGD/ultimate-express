declare module 'ultimate-express' {
    import express from '@types/express';
    import { AppOptions } from 'uWebSockets.js';
    import { parse } from 'qs';
    import { parse as fqsParse } from 'fast-querystring';
    type Settings = {
        uwsOptions?: AppOptions;
        threads?: number;
        "trust proxy fn"?: (ip: string, trust: string) => boolean;
        "query parser fn"?: parse | fqsParse;
        "view cache"?: boolean;
        "views"?: string;
        "etag fn"?: (body: any, econding: any) => string;
        "case sensitive routing"?: boolean;
        "strict routing"?: boolean;
    }
    export function express(settings?: Settings): ReturnType<typeof express>;
    export = express;
}