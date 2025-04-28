// must support emit on req and res

const express = require("express");

const app = express();

let events = [];

app.post("/test", (req, res) => {
  req
    .on("close", () => events.push("req close"))
    .on("data", () => events.push("req data"))
    .on("end", () => events.push("req end"));

  res
    .on("close", () => events.push("res close"))
    .on("data", () => events.push("res data"))
    .on("end", () => events.push("res end"));

  res.send("hello");
});

app.listen(13333, async () => {
  console.log("Server is running on port 13333");

  const data = await fetch("http://localhost:13333/test", {
    method: "POST",
  }).then((res) => res.text());
  console.log(data);

  // Event are the same but emitted in different order
  console.log(events.sort((a, b) => a.localeCompare(b)).join("\n"));

  process.exit(0);
});
