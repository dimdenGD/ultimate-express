const fs = require('fs');
const path = require('path');

function static(root, options) {
    if(!options) options = {};
    if(typeof options.index === 'undefined') options.index = 'index.html';
    if(typeof options.redirect === 'undefined') options.redirect = true;
    if(typeof options.fallthrough === 'undefined') options.fallthrough = true;
    options.root = root;

    return (req, res, next) => {
        let _path = req.url;
        let fullpath = path.resolve(path.join(options.root, req.url));
        if(options.root && !fullpath.startsWith(path.resolve(options.root))) {
            res.status(403);
            return next(!options.fallthrough ? new Error('Forbidden') : undefined);
        }

        let stat;
        try {
            stat = fs.statSync(fullpath);
        } catch(err) {
            res.status(404);
            return next(!options.fallthrough ? err.message : undefined);
        }

        if(stat.isDirectory()) {
            if(!req.endsWithSlash) {
                if(options.redirect) return res.redirect(301, req.path + '/');
                else {
                    res.status(404);
                    return next(!options.fallthrough ? new Error('Not found') : undefined);
                }
            }
            if(options.index) {
                try {
                    stat = fs.statSync(path.join(fullpath, options.index));
                    _path = path.join(req.url, options.index);
                } catch(err) {
                    res.status(404);
                    return next(!options.fallthrough ? new Error('Not found') : undefined);
                }
            } else {

                return next();
            }
        }

        options._stat = stat;

        return res.sendFile(_path, options, e => {
            if(e) {
                next(!options.fallthrough ? e : undefined);
            }
        });
    }
}

module.exports = {
    static
};
