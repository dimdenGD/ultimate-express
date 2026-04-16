// must support server.close()

const express = require("express");

const app = express();

const server = app.listen(13333, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("Server is listening on port 13333");
});

setTimeout(() => {
    server.close((err) => {
        console.log("Server closed successfully");
        if(err){
            console.log(err);
        }
        process.exit(err ? 1 : 0)
    })
}, 1000);
