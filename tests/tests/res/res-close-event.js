// res must support close event

const express = require("express");
const { fetchTest } = require("../../utils");

const app = express();

app.post("/test", (req, res) => {
  res
    .on("close", () => console.log("res close"));

  res.send("hello");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const data = await fetchTest("http://localhost:13333/test", {method: 'POST'}).then(res => res.text());
  console.log(data);

  process.exit(0);
});