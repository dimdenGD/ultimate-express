// must support res error response was already sent

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.get("/test", (req, res) => {
  res.send("Hello World");
  res.send("Hello World"); // Response was already sent!
});

app.use((err, req, res, next) => {
  console.log(typeof err?.message === "string"); // just check if there is an error
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const responses = await fetchTest("http://localhost:13333/test").then((res) =>
    res.text()
  );

  console.log(responses);
  process.exit(0);
});
