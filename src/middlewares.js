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
const zlib = require('fast-zlib');
const typeis = require('type-is');

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

function createInflate(contentEncoding) {
    const encoding = (contentEncoding || 'identity').toLowerCase();
    switch(encoding) {
        case 'identity':
            return;
        case 'deflate':
            return new zlib.Inflate();
        case 'gzip':
            return new zlib.Gunzip();
        case 'br':
            return new zlib.BrotliDecompress();
        default:
            return false;
    }
}

function createBodyParser(defaultType, beforeReturn) {
    return function(options) {
        if(typeof options !== 'object') {
            options = {};
        }
        if(typeof options.limit === 'undefined') options.limit = bytes('100kb');
        else options.limit = bytes(options.limit);
    
        if(typeof options.type === 'undefined') options.type = defaultType;
        else if(typeof options.type !== 'string') {
            throw new Error('type must be a string');
        }
        if(typeof options.inflate === 'undefined') options.inflate = true;
        if(typeof options.type === 'string') {
            options.type = [options.type];
        } else if(typeof options.type !== 'function' && !Array.isArray(options.type)) {
            throw new Error('type must be a string, function or an array');
        }

        return (req, res, next) => {
            const type = req.headers['content-type'];

            // skip reading body for non-json content type
            if(!type) {
                return next();
            }

            // skip reading body twice
            if(req.body) {
                return next();
            }

            const length = req.headers['content-length'];
            // skip reading empty body
            if(length == '0') {
                return next();
            }

            // skip reading too large body
            if(length && +length > options.limit) {
                return next(new Error('Request entity too large'));
            }

            if(typeof options.type === 'function') {
                if(!options.type(req)) {
                    return next();
                }
            } else {
                if(!typeis(req, options.type)) {
                    return next();
                }
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

            const abs = [];
            let inflate;
            let totalSize = 0;
            if(options.inflate) {
                inflate = createInflate(req.headers['content-encoding']);
                if(inflate === false) {
                    return next(new Error('Unsupported content encoding'));
                }
            }

            function onData(buf) {
                if(!Buffer.isBuffer(buf)) {
                    buf = Buffer.from(buf);
                }
                if(inflate) {
                    buf = inflate.process(buf);
                }
                abs.push(buf);
                totalSize += buf.length;
                if(totalSize > options.limit) {
                    return next(new Error('Request entity too large'));
                }
            }
    
            function onEnd() {
                const buf = Buffer.concat(abs);
                if(options.verify) {
                    try {
                        options.verify(req, res, buf);
                    } catch(e) {
                        return next(e);
                    }
                }
                beforeReturn(req, res, next, options, buf);
            }
    
            // reading data directly from uWS is faster than from a stream
            // if we are fast enough (not async), we can do it
            // otherwise we need to use a stream since it already started streaming it
            if(!req.receivedData) {
                req._res.onData((ab, isLast) => {
                    onData(ab);
                    if(isLast) {
                        onEnd();
                    }
                });
            } else {
                req.on('data', onData);
                req.on('end', onEnd);
            }
        }
    }
}

const json = createBodyParser('application/json', function(req, res, next, options, buf) {
    if(options.strict) {
        if(req.body && typeof req.body !== 'object') {
            return next(new Error('Invalid body'));
        }
    }
    req.body = JSON.parse(buf.toString(), options.reviver);
    next();
});

const raw = createBodyParser('application/octet-stream', function(req, res, next, options, buf) {
    req.body = buf;
    next();
});

module.exports = {
    static,
    json,
    raw,
};
