/*
Copyright 2024 dimden.dev

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs');
const path = require('path');
const bytes = require('bytes');

function static(root, options) {
    if(!options) options = {};
    if(typeof options.index === 'undefined') options.index = 'index.html';
    if(typeof options.redirect === 'undefined') options.redirect = true;
    if(typeof options.fallthrough === 'undefined') options.fallthrough = true;
    if(typeof options.dotfiles === 'undefined') options.dotfiles = 'ignore_files';
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
    options.skipEncodePath = true;

    return (req, res, next) => {
        const iq = req.url.indexOf('?');
        let url = decodeURIComponent(iq !== -1 ? req.url.substring(0, iq) : req.url);
        let _path = url;
        let fullpath = path.resolve(path.join(options.root, url));
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
                        _path = url + '.' + options.extensions[i];
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
                    _path = path.join(url, options.index);
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

function json(options = {}) {
    if(typeof options !== 'object') {
        options = {};
    }
    if(typeof options.limit === 'undefined') options.limit = bytes('100kb');
    else options.limit = bytes(options.limit);

    if(typeof options.type === 'undefined') options.type = 'application/json';
    else if(typeof options.type !== 'string') {
        throw new Error('type must be a string');
    }

    return (req, res, next) => {
        const type = req.headers['content-type'];
        const semiColonIndex = type.indexOf(';');
        const contentType = semiColonIndex !== -1 ? type.substring(0, semiColonIndex) : type;
        if(!type || contentType !== options.type) {
            return next();
        }
        // skip reading body twice
        if(req.body) {
            return next();
        }

        // skip reading body for non-POST requests
        // this makes it +10k req/sec faster
        const additionalMethods = req.app.get('body methods');
        if(
            req.method !== 'POST' &&
            req.method !== 'PUT' &&
            req.method !== 'PATCH' && 
            (!additionalMethods || !additionalMethods.includes(req.method))
        ) {
            return next();
        }

        const abs = [], totalSize = 0;
        req._res.onData((ab, isLast) => {
            abs.push(ab);
            totalSize += ab.length;
            if(totalSize > options.limit) {
                return next(new Error('Request entity too large'));
            }
            if(isLast) {
                const buf = Buffer.concat(abs);
                if(options.verify) {
                    try {
                        options.verify(req, res, buf);
                    } catch(e) {
                        return next(e);
                    }
                }
                req.body = JSON.parse(buf, options.reviver);
                if(options.strict) {
                    if(req.body && typeof req.body !== 'object') {
                        return next(new Error('Invalid body'));
                    }
                }
                next();
            }
        });

    }

}

module.exports = {
    static
};
