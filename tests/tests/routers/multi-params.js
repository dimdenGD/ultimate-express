// must support multi params

const express = require("express");

const app = express();

app.get("/api/1.0/projects/:project_id/user/:user_id", (req, res) => {
    res.json({path: req.path, params: req.params});
});

app.get("/api/1.0/projects/:project_id/users", (req, res) => {
    res.json({path: req.path, params: req.params});
});

app.listen(13333, async () => {
    console.log("Server is running at http://localhost:13333");

    const responses = await Promise.all([
        fetch("http://localhost:13333/api/1.0/projects/123/users").then((res) =>
            res.json()
        ),
        fetch("http://localhost:13333/api/1.0/projects/456/user/789").then((res) =>
            res.json()
        ),
    ]);

    console.log(responses);

    process.exit(0);
});
