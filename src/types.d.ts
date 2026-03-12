declare module "ultimate-express" {
  import e from "@types/express";
  import uWS from "uWebSockets.js";

  type Settings = {
    uwsOptions?: uWS.AppOptions;
    threads?: number;
    http3?: boolean;
    uwsApp?: uWS.TemplatedApp;
  };

  namespace express {
    export import json = e.json;
    export import raw = e.raw;
    export import text = e.text;

    // export import application = e.application;
    export import request = e.request;
    export import response = e.response;

    export import static = e.static;
    // export import query = e.query;

    export import urlencoded = e.urlencoded;

    export import RouterOptions = e.RouterOptions;
    export import Application = e.Application;
    export import CookieOptions = e.CookieOptions;
    export import Errback = e.Errback;
    export import ErrorRequestHandler = e.ErrorRequestHandler;
    export import Express = e.Express;
    export import Handler = e.Handler;
    export import IRoute = e.IRoute;
    export import IRouter = e.IRouter;
    export import IRouterHandler = e.IRouterHandler;
    export import IRouterMatcher = e.IRouterMatcher;
    export import MediaType = e.MediaType;
    export import NextFunction = e.NextFunction;
    export import Locals = e.Locals;
    export import Request = e.Request;
    export import RequestHandler = e.RequestHandler;
    export import RequestParamHandler = e.RequestParamHandler;
    export import Response = e.Response;
    export import Router = e.Router;
    export import Send = e.Send;
  }

  type UltimateExpress = Omit<e.Express, 'listen'> & {
    readonly uwsApp: uWS.TemplatedApp;
    listen(port: number, callback?: (token: any) => void): uWS.TemplatedApp;
    listen(port: number, host: string, callback?: (token: any) => void): uWS.TemplatedApp;
    listen(callback: (token: any) => void): uWS.TemplatedApp;
  };

  function express(settings?: Settings): UltimateExpress;

  export = express;
}
