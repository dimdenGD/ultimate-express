declare module "ultimate-express" {
  import express from "@types/express";
  import { AppOptions } from "uWebSockets.js";
  import { parse } from "qs";
  import { parse as fqsParse } from "fast-querystring";

  type Settings = {
    uwsOptions?: AppOptions;
    threads?: number;
  };

  // Additional ultimate-express specific settings
  type setOptions = {
    "trust proxy fn"?: (ip: string, trust: string) => boolean;
    "query parser fn"?: typeof fqsParse | typeof parse;
    "view cache"?: boolean;
    "etag fn"?: (body: any, econding: any) => string;
    "case sensitive routing"?: boolean;
    "strict routing"?: boolean;
    [key: string]: any;
  };

  interface UltimateExpress extends express.Express {
    set<K extends keyof setOptions>(setting: K, value: setOptions[K]): this;
  }

  namespace uexpress {
    interface Express extends UltimateExpress {}

    export import json = express.json;
    export import raw = express.raw;
    export import text = express.text;
    
    // export import application = express.application;
    export import request = express.request;
    export import response = express.response;
    
    export import static = express.static;
    // export import query = express.query;

    export import urlencoded = express.urlencoded;
    
    export import RouterOptions = express.RouterOptions;
    export import Application = express.Application;
    export import CookieOptions = express.CookieOptions;
    export import Errback = express.Errback;
    export import ErrorRequestHandler = express.ErrorRequestHandler;
    export import Express = express.Express;
    export import Handler = express.Handler;
    export import IRoute = express.IRoute;
    export import IRouter = express.IRouter;
    export import IRouterHandler = express.IRouterHandler;
    export import IRouterMatcher = express.IRouterMatcher;
    export import MediaType = express.MediaType;
    export import NextFunction = express.NextFunction;
    export import Locals = express.Locals;
    export import Request = express.Request;
    export import RequestHandler = express.RequestHandler;
    export import RequestParamHandler = express.RequestParamHandler;
    export import Response = express.Response;
    export import Router = express.Router;
    export import Send = express.Send;
  }

  declare function uexpress(settings?: Settings): UltimateExpress;

  export = uexpress;
}
