// must support custom error handler

const express = require("express");

const app = express();

app.get('/test', (req, res, next) => {
    next(new Error("Error occurred!"));
});

app.use(
  function route(req, res, next) {
    if(req.path === '/test2') {
      next(new Error("Error occurred!"));
    } else {
      next();
    }
  },
  function error(err, req, res, next) {
    console.error(err.message);
    res.status(500).json({ error: "custom error handler" });
  }
);

app.get('/test3', (req, res, next) => {
    next(new Error("Error occurred!"));
});

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: "normal error handler" });
});


app.listen(13333, async() => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test').then(res => res.json());
    let output2 = await fetch('http://localhost:13333/test2').then(res => res.json());
    let output3 = await fetch('http://localhost:13333/test3').then(res => res.json());

    console.log(output1);
    console.log(output2);
    console.log(output3);
    process.exit(0);
});