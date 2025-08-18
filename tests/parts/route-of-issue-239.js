module.exports = function(express) {
    const router = express.Router();

    router.post("/path", function handler(req, res) {
        throw new Error("Whoops");
        //return res.send("test");
    });

    return router;
}