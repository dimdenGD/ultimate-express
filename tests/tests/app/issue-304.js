// issue-304

const express = require("express");

const app1 = express();
const app2 = express();

process.on('uncaughtException', (err) => {
  console.log({error: err.message});
  process.exit(0);
});


app1.listen(13333, (token1) => {
  console.log({token1});

  app2.listen(13333, (token2) => {
    console.log({token2});
    process.exit(0);
  });
});

