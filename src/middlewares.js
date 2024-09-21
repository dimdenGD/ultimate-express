const fs = require('fs');
const path = require('path');

function static(root, options) {
    if(!options) options = {};
    if(typeof options.index === 'undefined') options.index = 'index.html';
    if(typeof options.redirect === 'undefined') options.redirect = true;
    if(typeof options.fallthrough === 'undefined') options.fallthrough = true;
    if(options.extensions) {
        if(typeof options.extensions !== 'string' && !Array.isArray(options.extensions)) {
            throw new Error('extensions must be a string or an array');
        }
        if(!Array.isArray(options.extensions)) {
            options.extensions = [options.extensions];
        }
        options.extensions = options.extensions.map(ext => ext.startsWith('.') ? ext.slice(1) : ext);
    }
    options.root = root;

    return (req, res, next) => {
        let _path = req.url;
        let fullpath = path.resolve(path.join(options.root, req.url));
        if(options.root && !fullpath.startsWith(path.resolve(options.root))) {
            if(!options.fallthrough) {
                res.status(403);
                return next(new Error('Forbidden'));
            } else return next();
        }

        let stat;
        try {
            stat = fs.statSync(fullpath);
        } catch(err) {
            const ext = path.extname(fullpath);
            let i = 0;
            if(ext === '' && options.extensions) {
                while(i < options.extensions.length) {
                    try {
                        stat = fs.statSync(fullpath + '.' + options.extensions[i]);
                        _path = req.url.split('?')[0] + '.' + options.extensions[i];
                        break;
                    } catch(err) {
                        i++;
                    }
                }
            }
            if(!stat) {
                if(!options.fallthrough) {
                    res.status(404);
                    return next(err.message);
                } else return next();
            }
        }

        if(stat.isDirectory()) {
            if(!req.endsWithSlash) {
                if(options.redirect) return res.redirect(301, req.path + '/');
                else {
                    if(!options.fallthrough) {
                        res.status(404);
                        return next(new Error('Not found'));
                    } else return next();
                }
            }
            if(options.index) {
                try {
                    stat = fs.statSync(path.join(fullpath, options.index));
                    _path = path.join(req.url, options.index);
                } catch(err) {
                    if(!options.fallthrough) {
                        res.status(404);
                        return next(new Error('Not found'));
                    } else return next();
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
