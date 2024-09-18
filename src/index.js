const Application = require("./application.js");
const Router = require("./router.js");
const bodyParser = require("body-parser");

Application.Router = function() {
    return new Router();
}

Application.json = bodyParser.json;
Application.urlencoded = bodyParser.urlencoded;
Application.text = bodyParser.text;
Application.raw = bodyParser.raw;

module.exports = Application;
