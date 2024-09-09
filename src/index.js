import Application from './application.js';
import Router from './router.js';

Application.Router = function(mountpath = "/") {
    return new Router(mountpath);
}

export default Application;
