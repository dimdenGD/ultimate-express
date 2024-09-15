import Application from './application.js';
import Router from './router.js';
import bodyParser from 'body-parser';

Application.Router = function() {
    return new Router();
}

Application.json = bodyParser.json;
Application.urlencoded = bodyParser.urlencoded;
Application.text = bodyParser.text;
Application.raw = bodyParser.raw;

export default Application;
