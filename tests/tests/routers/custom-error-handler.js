// must support custom error handler

const express = require("express");

const app = express();

app.use(
  function route(req, res, next) {
    try {
      throw new Error("Error occurred!");
    } catch (error) {
      next(error);
    }
  },
  function error(err, req, res, next) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

app.listen(13333, async() => {
    console.log('Server is running on port 13333');

    let output = await fetch('http://localhost:13333/').then(res => res.json());

    console.log(output);
    process.exit(0);
});
