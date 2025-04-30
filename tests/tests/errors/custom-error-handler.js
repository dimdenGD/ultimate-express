// must support custom error handler

const express = require("express");

const app = express();

app.get('/test1', (req, res, next) => {
    next(new Error("Error occurred 1!"));
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
    res.status(500).json({ error: "custom error handler 1" });
  }
);

app.get('/test3', (req, res, next) => {
    next(new Error("Error occurred 3!"));
});

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: "normal error handler 3" });
});

const router = express.Router();

app.get('/test4', router);

app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({error: "normal error handler 4"});
});

router.use((req, res, next) => {
    next(new Error("Error occurred 4!"));
});

const router5 = express.Router();
app.get('/test5', router5);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({error: "normal error handler 5"});
});

router5.use((req, res, next) => {
  next(new Error("Error occurred 5!"));
});

app.listen(13333, async() => {
    console.log('Server is running on port 13333');

    let output1 = await fetch('http://localhost:13333/test1').then(res => res.json());
    let output2 = await fetch('http://localhost:13333/test2').then(res => res.json());
    let output3 = await fetch('http://localhost:13333/test3').then(res => res.json());
    let output4 = await fetch('http://localhost:13333/test4').then(res => res.json());
    let output5 = await fetch('http://localhost:13333/test5').then(res => res.json());

    console.log(output1);
    console.log(output2);
    console.log(output3);
    console.log(output4);
    console.log(output5);
    
    process.exit(0);
});
