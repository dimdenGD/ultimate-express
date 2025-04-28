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

const path = require("path");
const fs = require("fs");
const { NullObject } = require("./utils.js");

/**
 * Represents a view in the application.
 * Handles rendering and resolving view files.
 */
module.exports = class View {
    /**
     * Creates a new View instance.
     * @param {string} name - The name of the view file.
     * @param {Object} options - Configuration options for the view.
     * @param {string} [options.defaultEngine] - The default template engine to use.
     * @param {string|string[]} [options.root] - The root directory or directories for views.
     * @param {Object} [options.engines] - A map of file extensions to template engine functions.
     */
    constructor(name, options) {
        this.name = name;
        this.options = options ? Object.assign({}, options) : new NullObject();
        this.defaultEngine = options.defaultEngine;
        this.ext = path.extname(name);
        this.root = options.root;

        if (!this.ext && !this.defaultEngine) {
            throw new Error('No default engine was specified and no extension was provided.');
        }

        let fileName = name;
        if(!this.ext) {
            this.ext = this.defaultEngine[0] !== '.'
                ? '.' + this.defaultEngine
                : this.defaultEngine;
        
            fileName += this.ext;
        }

        if (!this.options.engines[this.ext]) {
            const mod = this.ext.slice(1);

            // default engine export
            const fn = require(mod).__express;
        
            if (typeof fn !== 'function') {
              throw new Error('Module "' + mod + '" does not provide a view engine.')
            }
        
            this.options.engines[this.ext] = fn;
        }

        this.engine = this.options.engines[this.ext];
        if(path.isAbsolute(name)) {
            this.path = name;
            if(path.extname(name) === '') {
                this.path += this.ext;
            }
        } else {
            this.path = path.join(this.root, fileName);
        }
    }

    /**
     * Looks up the full path of a view file.
     * @param {string} name - The name of the view file to look up.
     * @returns {string|undefined} The resolved file path, or undefined if not found.
     */
    lookup(name) {
        let path;
        let roots = [].concat(this.root);
        for (let i = 0; i < roots.length && !path; i++) {
            const root = roots[i];
        
            // resolve the path
            const loc = path.resolve(root, name);
            const dir = path.dirname(loc);
            const file = path.basename(loc);
        
            // resolve the file
            path = this.resolve(dir, file);
        }
        
        return path;
    }

    /**
     * Renders the view using the associated template engine.
     * ill be real idk what exactly this does but express implements it this way
     * @param {Object} options - The options to pass to the template engine.
     * @param {Function} callback - The callback to execute after rendering.
     */
    render(options, callback) {
        let sync = true;
        this.engine(this.path, options, function onRender() {
            if(!sync) {
                return callback.apply(this, arguments);
            }

            return process.nextTick(() => {
                return callback.apply(this, arguments);
            });
        });

        sync = false;
    }

    /**
     * Resolves the path of a view file, checking for the existence of the file.
     * @param {string} dir - The directory to search in.
     * @param {string} file - The name of the file to resolve.
     * @returns {string|undefined} The resolved file path, or undefined if not found.
     */
    resolve(dir, file) {
        const ext = this.ext;

        // <path>.<ext>
        let path = path.join(dir, file);
        let stat = tryStat(path);

        if(stat && stat.isFile()) {
            return path;
        }

        // <path>/index.<ext>
        path = path.join(dir, path.basename(file, ext) + ext);
        stat = tryStat(path);

        if(stat && stat.isFile()) {
            return path;
        }
    }
}

/**
 * Attempts to retrieve the file stats for a given path.
 * @param {string} path - The file path to check.
 * @returns {fs.Stats|undefined} The file stats if the file exists, or undefined otherwise.
 */
function tryStat(path) {  
    try {
        return fs.statSync(path);
    } catch (e) {
        return undefined;
    }
}