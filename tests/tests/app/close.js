// must support server.close()

const express = require("../../../src");

const app = express();

const server = app.listen(13333, () => {
    console.log("Server is listening on port 13333");
});

server.close(() => {
    console.log("Server closed successfully");
    process.exit(0);
})
