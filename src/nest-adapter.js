const { ExpressAdapter } = require("@nestjs/platform-express");
const Application = require("./application.js");

const getParserOptions = (rawBody, options) => ({
  ...options,
  ...(rawBody && {
    verify: (req, _, buff) => {
      if (Buffer.isBuffer(buff)) {
        req.rawBody = buff;
      }
      return true;
    },
  }),
});

module.exports = class extends ExpressAdapter {
  constructor(instance) {
    super(instance || Application());
  }

  registerParserMiddleware(_, rawBody) {
    const jsonOptions = getParserOptions(!!rawBody);
    const urlencodedOptions = getParserOptions(!!rawBody, { extended: true });

    const parserMiddleware = {
      jsonParser: Application.json(jsonOptions),
      urlencodedParser: Application.urlencoded(urlencodedOptions),
    };

    Object.keys(parserMiddleware)
      .filter((parser) => !this.#isMiddlewareApplied(parser))
      .forEach((parserKey) => this.use(parserMiddleware[parserKey]));
  }

  useBodyParser(type, rawBody, options) {
    const parserOptions = getParserOptions(rawBody, options);
    const parser = Application[type](parserOptions);

    this.use(parser);

    return this;
  }

  initHttpServer(options) {
    super.initHttpServer(options);
    this.httpServer = this.getInstance();
  }

  #isMiddlewareApplied(name) {
    const app = this.getInstance();

    return (
      !!app._router &&
      !!app._router.stack &&
      typeof app._router.stack.filter === "function" &&
      app._router.stack.some(
        (layer) => layer?.handle && layer.handle.name === name,
      )
    );
  }
};
