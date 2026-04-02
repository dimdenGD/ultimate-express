import { expectType, expectAssignable } from 'tsd';
import express from 'ultimate-express';
import type {
  Request, Response, NextFunction,
  IRouter, RequestHandler, ErrorRequestHandler
} from 'express';
import type { Server } from 'http';

const app = express();

// Common properties
expectAssignable<string | string[]>(app.mountpath);
expectAssignable<Record<string, any>>(app.locals);

// HTTP methods
app.get('/test', (_req, res) => res.send('GET'));
app.post('/test', (_req, res) => res.send('POST'));
app.put('/test', (_req, res) => res.send('PUT'));
app.delete('/test', (_req, res) => res.send('DELETE'));
app.patch('/test', (_req, res) => res.send('PATCH'));
app.all('/all', (_req, res) => res.send('ALL'));

// Settings
app.set('view engine', 'pug');
expectType<any>(app.get('view engine'));
expectType<boolean>(app.enabled('trust proxy'));

// Middleware
app.use((_req, _res, next) => next());
app.use('/api', (_req, _res, next) => next());

// Request
app.get('/request', (req: Request, res: Response) => {
  expectType<string>(req.method);
  expectType<string>(req.url);
  expectType<string>(req.path);
  expectType<any>(req.body);
  expectAssignable<Record<string, any>>(req.query);
  expectAssignable<Record<string, string>>(req.params);
  expectType<any>(req.cookies);
  
  expectType<string | undefined>(req.get('Content-Type'));
  expectAssignable<string | false | string[]>(req.accepts('json'));
  expectAssignable<string | false | null>(req.is('json'));
  
  res.send('OK');
});

// Request with generics
app.get<{ id: string }>('/users/:id', (req, res) => {
  expectType<string>(req.params.id);
  res.send('OK');
});

// Response
app.get('/response', (_req: Request, res: Response) => {
  res.send('text');
  res.json({ ok: true });
  res.status(200).send('OK');
  res.redirect('/home');
  
  res.set('X-Custom', 'value');
  expectType<string | undefined>(res.get('Content-Type'));
  
  res.cookie('name', 'value', { httpOnly: true });
  res.clearCookie('name');
  
  expectType<boolean>(res.headersSent);
  expectAssignable<Record<string, any>>(res.locals);
});

// Router
const router = express.Router();
expectAssignable<IRouter>(router);

router.get('/test', (_req, res) => res.send('OK'));
router.use((_req, _res, next) => next());
router.param('id', (_req, _res, next, id) => { console.log(id); next(); });

app.use('/api', router);

// Router with options
const strictRouter = express.Router({ strict: true, mergeParams: true });
expectAssignable<IRouter>(strictRouter);

// Middleware types
const handler: RequestHandler = (_req, res) => res.send('OK');
expectAssignable<RequestHandler>(handler);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  res.status(500).json({ error: err.message });
};
expectAssignable<ErrorRequestHandler>(errorHandler);

app.use(handler);
app.use(errorHandler);

// Built-in middleware
expectAssignable<RequestHandler>(express.json());
expectAssignable<RequestHandler>(express.json({ limit: '10mb' }));

expectAssignable<RequestHandler>(express.urlencoded({ extended: true }));

expectAssignable<RequestHandler>(express.static('public'));
expectAssignable<RequestHandler>(express.static('public', { maxAge: '1d' }));

expectAssignable<RequestHandler>(express.raw());
expectAssignable<RequestHandler>(express.text());

// Middleware chain
app.post('/users',
  express.json(),
  (req, res, next) => { if (!req.body.name) return res.status(400).send('Name required'); next(); },
  (_req, res) => res.status(201).json({ created: true })
);

// Sub-router pattern
const apiRouter = express.Router();
apiRouter.get('/users', (_req, res) => res.json([]));
apiRouter.post('/users', express.json(), (_req, res) => res.status(201).json({}));
app.use('/api/v1', apiRouter);

// Error handling
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

const server = app.listen(3000);
expectAssignable<Server>(server);
server.close();