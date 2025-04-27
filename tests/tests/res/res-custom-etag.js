// must support etag fn

const express = require("express");

const app = express();

app.set("etag fn", () => "foo");

app.get("/test", (req, res) => {
  res.send("test");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const response = await fetch("http://localhost:13333/test");
  console.log(response.headers.get("ETag"));
  process.exit(0);
});
