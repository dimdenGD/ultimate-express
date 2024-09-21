const Application = require("./application.js");
const Router = require("./router.js");
const bodyParser = require("body-parser");
const { static } = require("./middlewares.js");
const Request = require("./request.js");
const Response = require("./response.js");

Application.Router = function(options) {

    return new Router(options);
}

Application.request = Request.prototype;
Application.response = Response.prototype;

Application.static = static;

Application.json = bodyParser.json;
Application.urlencoded = bodyParser.urlencoded;
Application.text = bodyParser.text;
Application.raw = bodyParser.raw;

module.exports = Application;
