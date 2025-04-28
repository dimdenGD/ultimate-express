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

const mime = require("mime-types");
const path = require("path");
const proxyaddr = require("proxy-addr");
const qs = require("qs");
const querystring = require("fast-querystring");
const etag = require("etag");
const { Stats } = require("fs");

const EMPTY_REGEX = new RegExp(``);

/**
 * Parses a query string into an object.
 * @param {string} query - The query string to parse.
 * @param {Object} [options] - Options for parsing.
 * @returns {Object} - The parsed query object.
 */
function fastQueryParse(query, options) {
    const len = query.length;
    if(len === 0){
        return new NullObject();
    }
    if(len <= 128) {
        if(!query.includes('[') && !query.includes('%5B') && !query.includes('.') && !query.includes('%2E')) {
            // [Object: null prototype] issue
            return {...querystring.parse(query)};
        }
    }
    // [Object: null prototype] issue
    return {...qs.parse(query, options)};
}

/**
 * Removes duplicate slashes from a given path.
 * @param {string} path - The input path.
 * @returns {string} - The normalized path with duplicate slashes removed.
 */
function removeDuplicateSlashes(path) {
    return path.replace(/\/{2,}/g, '/');
}

/**
 * Converts a pattern string into a regular expression.
 * @param {string|RegExp} pattern - The pattern to convert.
 * @param {boolean} [isPrefix=false] - Whether the pattern is a prefix.
 * @returns {RegExp} - The resulting regular expression.
 */
function patternToRegex(pattern, isPrefix = false) {
    if(pattern instanceof RegExp) {
        return pattern;
    }
    if(isPrefix && pattern === '') {
        return EMPTY_REGEX;
    }

    let regexPattern = pattern
        .replaceAll('.', '\\.')
        .replaceAll('-', '\\-')
        .replaceAll('*', '(.*)') // Convert * to .*
        .replace(/\/:(\w+)(\(.+?\))?\??/g, (match, param, regex) => {
            const optional = match.endsWith('?');
            return `\\/${optional ? '?' : ''}?(?<${param}>${regex ? regex + '($|\\/)' : '[^/]+'})${optional ? '?' : ''}`;
        }); // Convert :param to capture group

    return new RegExp(`^${regexPattern}${isPrefix ? '(?=$|\/)' : '$'}`);
}

/**
 * Determines if a pattern needs to be converted to a regular expression.
 * @param {string|RegExp} pattern - The pattern to check.
 * @returns {boolean} - True if conversion is needed, false otherwise.
 */
function needsConversionToRegex(pattern) {
    if(pattern instanceof RegExp) {
        return false;
    }
    if(pattern === '/*') {
        return false;
    }

    return pattern.includes('*') ||
        pattern.includes('?') ||
        pattern.includes('+') ||
        pattern.includes('(') ||
        pattern.includes(')') ||
        pattern.includes(':') ||
        pattern.includes('{') ||
        pattern.includes('}') ||
        pattern.includes('[') ||
        pattern.includes(']');
}

/**
 * Determines whether a given pattern can be optimized.
 * @param {string|RegExp} pattern - The pattern to evaluate.
 * @returns {boolean} Returns `true` if the pattern can be optimized, otherwise `false`.
 */
function canBeOptimized(pattern) {
    if(pattern === '/*') {
        return false;
    }
    if(pattern instanceof RegExp) {
        return false;
    }
    if(
        pattern.includes('*') ||
        pattern.includes('?') ||
        pattern.includes('+') ||
        pattern.includes('(') ||
        pattern.includes(')') ||
        pattern.includes('{') ||
        pattern.includes('}') ||
        pattern.includes('[') ||
        pattern.includes(']')
    ) {
        return false;
    }
    return true;
}

function acceptParams(str) {
    const length = str.length;
    const colonIndex = str.indexOf(';');
    let index = colonIndex === -1 ? length : colonIndex;
    const ret = { value: str.slice(0, index).trim(), quality: 1, params: {} };

    while (index < length) {
        const splitIndex = str.indexOf('=', index);
        if (splitIndex === -1) break;

        const colonIndex = str.indexOf(';', index);
        const endIndex = colonIndex === -1 ? length : colonIndex;

        if (splitIndex > endIndex) {
            index = str.lastIndexOf(';', splitIndex - 1) + 1;
            continue;
        }

        const key = str.slice(index, splitIndex).trim();
        const value = str.slice(splitIndex + 1, endIndex).trim();

        if (key === 'q') {
            ret.quality = parseFloat(value);
        } else {
            ret.params[key] = value;
        }

        index = endIndex + 1;
    }
  
    return ret;
}

/**
 * Normalizes a MIME type string.
 * @param {string} type - The MIME type or file extension.
 * @returns {Object} - An object containing the normalized MIME type and parameters.
 */
function normalizeType(type) {
    return ~type.indexOf('/') ?
        acceptParams(type) :
        { value: (mime.lookup(type) || 'application/octet-stream'), params: {} };
}

/**
 * Converts a value to a JSON string with optional escaping.
 * @param {*} value - The value to stringify.
 * @param {Function} [replacer] - A function to transform the result.
 * @param {number|string} [spaces] - The number of spaces for indentation.
 * @param {boolean} [escape=false] - Whether to escape special characters.
 * @returns {string} - The JSON string representation of the value.
 */
function stringify(value, replacer, spaces, escape) {
    let json = replacer || spaces
        ? JSON.stringify(value, replacer, spaces)
        : JSON.stringify(value);
  
    if (escape && typeof json === 'string') {
        json = json.replace(/[<>&]/g, function (c) {
            switch (c.charCodeAt(0)) {
                case 0x3c:
                    return '\\u003c'
                case 0x3e:
                    return '\\u003e'
                case 0x26:
                    return '\\u0026'
                default:
                    return c
            }
        });
    }
  
    return json;
}

const defaultSettings = {
    'jsonp callback name': 'callback',
    'env': () => process.env.NODE_ENV ?? 'development',
    'etag': 'weak',
    'etag fn': () => createETagGenerator({ weak: true }),
    'query parser': 'extended',
    'query parser fn': () => fastQueryParse,
    'subdomain offset': 2,
    'trust proxy': false,
    'views': () => path.join(process.cwd(), 'views'),
    'view cache': () => process.env.NODE_ENV === 'production',
    'x-powered-by': true,
    'case sensitive routing': true,
    'declarative responses': true
};

/**
 * Compiles a trust proxy function based on the given value.
 * @param {boolean|number|string|Function} val - The trust proxy setting.
 * @returns {Function} - A function to determine if a proxy is trusted.
 */
function compileTrust(val) {
    if (typeof val === 'function') return val;
  
    if (val === true) {
        // Support plain true/false
        return function(){ return true };
    }
  
    if (typeof val === 'number') {
        // Support trusting hop count
        return function(a, i){ return i < val };
    }
  
    if (typeof val === 'string') {
        // Support comma-separated values
        val = val.split(',')
            .map(function (v) { return v.trim() })
    }
  
    return proxyaddr.compile(val || []);
}

const shownWarnings = new Set();
/**
 * Logs a deprecation warning for a method.
 * @param {string} oldMethod - The deprecated method name.
 * @param {string} newMethod - The replacement method name.
 * @param {boolean} [full=false] - Whether to include the full stack trace.
 */
function deprecated(oldMethod, newMethod, full = false) {
    const err = new Error();
    const pos = full ? err.stack.split('\n').slice(1).join('\n') : err.stack.split('\n')[3].trim().split('(').slice(1).join('(').split(')').slice(0, -1).join(')');
    if(shownWarnings.has(pos)) return;
    shownWarnings.add(pos);
    console.warn(`${new Date().toLocaleString('en-UK', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'GMT',
        timeZoneName: 'short'
    })} u-express deprecated ${oldMethod}: Use ${newMethod} instead at ${pos}`);
}

/**
 * Finds the index of the first element in an array that satisfies a condition, starting from a given index.
 * @param {Array} arr - The array to search.
 * @param {Function} fn - The condition function.
 * @param {number} [index=0] - The starting index.
 * @returns {number} - The index of the first matching element, or -1 if none found.
 */
function findIndexStartingFrom(arr, fn, index = 0) {
    for(let i = index, end = arr.length; i < end; i++) {
        if(fn(arr[i], i, arr)) {
            return i;
        }
    }
    return -1;
};

/**
 * Decodes a URI component safely.
 * @param {string} path - The URI component to decode.
 * @returns {string|number} - The decoded string, or -1 if decoding fails.
 */
function decode (path) {
    try {
        return decodeURIComponent(path)
    } catch (err) {
        return -1
    }
}

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

/**
 * Checks if an array of path parts contains a dotfile.
 * @param {string[]} parts - The array of path parts.
 * @returns {boolean} - True if a dotfile is found, false otherwise.
 */
function containsDotFile(parts) {
    for(let i = 0, len = parts.length; i < len; i++) {
        const part = parts[i];
        if(part.length > 1 && part[0] === '.') {
            return true;
        }
    }
  
    return false;
}

/**
 * Parses a comma-separated token list from a string.
 * @param {string} str - The input string.
 * @returns {string[]} - An array of tokens.
 */
function parseTokenList(str) {
    let end = 0;
    const list = [];
    let start = 0;
  
    // gather tokens
    for (let i = 0, len = str.length; i < len; i++) {
        switch(str.charCodeAt(i)) {
            case 0x20: /*   */
                if (start === end) {
                    start = end = i + 1;
                }
                break;
            case 0x2c: /* , */
                if (start !== end) {
                    list.push(str.substring(start, end));
                }
                start = end = i + 1;
                break;
            default:
                end = i + 1;
                break;
        }
    }
  
    // final token
    if (start !== end) {
        list.push(str.substring(start, end));
    }
  
    return list;
}

/**
 * Parses an HTTP date string into a timestamp.
 * @param {string} date - The HTTP date string.
 * @returns {number} - The timestamp, or NaN if parsing fails.
 */
function parseHttpDate(date) {
    const timestamp = date && Date.parse(date);
    return typeof timestamp === 'number' ? timestamp : NaN;
}

/**
 * Checks if a request fails precondition headers.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {boolean} - True if preconditions fail, false otherwise.
 */
function isPreconditionFailure(req, res) {
    const match = req.headers['if-match'];

    // if-match
    if(match) {
        const etag = res.get('etag');
        return !etag || (match !== '*' && parseTokenList(match).every(match => {
            return match !== etag && match !== 'W/' + etag && 'W/' + match !== etag;
        }));
    }

    // if-unmodified-since
    const unmodifiedSince = parseHttpDate(req.headers['if-unmodified-since']);
    if(!isNaN(unmodifiedSince)) {
        const lastModified = parseHttpDate(res.get('Last-Modified'));
        return isNaN(lastModified) || lastModified > unmodifiedSince;
    }

    return false;
}

/**
 * Creates an ETag generator function.
 * @param {Object} options - Options for ETag generation.
 * @returns {Function} - The ETag generator function.
 */
function createETagGenerator(options) {
    return function generateETag (body, encoding) {
        if(body instanceof Stats) {
            return etag(body, options);
        }
        const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;
        return etag(buf, options);
    }
}

/**
 * Checks if a range request is fresh based on the If-Range header.
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {boolean} - True if the range is fresh, false otherwise.
 */
function isRangeFresh(req, res) {
    const ifRange = req.headers['if-range'];
    if(!ifRange) {
        return true;
    }

    // if-range as etag
    if(ifRange.indexOf('"') !== -1) {
        const etag = res.get('etag');
        return Boolean(etag && ifRange.indexOf(etag) !== -1);
    }

    // if-range as modified date
    const lastModified = res.get('Last-Modified');
    return parseHttpDate(lastModified) <= parseHttpDate(ifRange);
}

// fast null object
const NullObject = function() {};
NullObject.prototype = Object.create(null);

module.exports = {
    removeDuplicateSlashes,
    patternToRegex,
    needsConversionToRegex,
    acceptParams,
    normalizeType,
    stringify,
    defaultSettings,
    compileTrust,
    deprecated,
    UP_PATH_REGEXP,
    NullObject,
    decode,
    containsDotFile,
    parseTokenList,
    parseHttpDate,
    isPreconditionFailure,
    createETagGenerator,
    isRangeFresh,
    findIndexStartingFrom,
    fastQueryParse,
    canBeOptimized,
    EMPTY_REGEX
};
