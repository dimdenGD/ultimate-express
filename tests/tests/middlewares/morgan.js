// must support morgan middleware

const express = require("express");
const { fetchTest } = require("../../utils");
const morgan = require("morgan");

const app = express();

app.use(morgan(':method :url :status'));

app.get("/", function (req, res) {
  res.send("hello, world!");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const response = await fetchTest("http://localhost:13333/").then((res) =>
    res.text()
  );
  console.log(response);

  process.exit(0);
});
