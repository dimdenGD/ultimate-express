// must support error propagation through middlewares

const express = require("express");

const app = express();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const dynamicRouter = async (req, res, next) => {
    throw new Error("error");
};

app.use(asyncHandler(dynamicRouter));

const handler1 = (err, _req, res, next) => {
  console.log("handler1");
  next(err);
};

const generalHandler = (err, _req, res, _next) => {
  console.log("generalHandler");
  if (err instanceof Error) {
    return res.send(err.message);
  }
  if (typeof err === "string") {
    return res.send(err);
  }
  return res.send("UNEXPECTED_ERROR");
};

app.use(handler1);
app.use(generalHandler);

app.listen(13333, async () => {
    console.log("Server is running at http://localhost:13333");
    console.log(
        await fetch("http://localhost:13333/")
            .then((res) => res.text())
            .catch((err) => err.message),
    );
    process.exit(0);
});
