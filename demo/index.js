const express = require("../src/index");
const compression = require("compression");

const app = express();

app.set("catch async errors", true);

app.use(express.json({ limit: "100mb" }));
app.use(compression({ threshold: 1 }));

app.all("/response", async (req, res) => {
  res.status(200).send(req.body.data ?? "Hello World! ".repeat(1000) + " End");
});

app.all("/error", async (req, res, next) => {
  try {
    throw new Error(req.query.message ?? "test");
  } catch (error) {
    next(error);
  }
});

app.use(async (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err.message);
});

app.listen(13333, () => {
  console.log("Server is running at http://localhost:13333");
});
