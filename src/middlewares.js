const fs = require('fs');
const path = require('path');

function static(root, options) {
    if(!options) options = {};
    if(!options.index) options.index = 'index.html';
    options.root = root;
    return (req, res, next) => {
        let _path = req.url;
        let fullpath = path.resolve(path.join(options.root, req.url));
        if(options.root && !fullpath.startsWith(path.resolve(options.root))) {
            return next(!options.passthrough ? new Error('Forbidden') : undefined);
        }

        let stat;
        try {
            stat = fs.statSync(fullpath);
        } catch(err) {
            return next();
        }

        if(stat.isDirectory()) {
            if(options.index) {
                try {
                    stat = fs.statSync(path.join(fullpath, options.index));
                    _path = path.join(req.url, options.index);
                } catch(err) {
                    return next();
                }
            } else {
                return next();
            }
        }

        options._stat = stat;

        return res.sendFile(_path, options, e => {
            if(e) {
                next(!options.passthrough ? e : undefined);
            }
        });
    }
}

module.exports = {
    static
};
