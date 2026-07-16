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

function removeDuplicateSlashes(path) {
    return path.replace(/\/{2,}/g, '/');
}

function patternToRegex(pattern, isPrefix = false) {
    if(pattern instanceof RegExp) {
        return pattern;
    }
    if(isPrefix && pattern === '') {
        return EMPTY_REGEX;
    }

    let wildcardIndex = 0;
    let regexPattern = '';
    const captureGroupTest = /(\/|[.-]+):(\w+)(?:\((.+?)\))?\??/g;
    let offset = 0;
    while (true) {
        const result = captureGroupTest.exec(pattern);
        // Process last preceding part if matched, or final part if match ended
        regexPattern += pattern.substring(offset, result?.index ?? pattern.length)
            .replaceAll('.', '\\.')
            .replaceAll('-', '\\-')
            .replaceAll(/(\*|\(.*?\))/g, (match) => // Convert * to .* and stuff in parentheses to capture group
                `(?<_wc${wildcardIndex++}>${match.startsWith('(') ? match.slice(1, -1) : match.replaceAll('*', '.*')})`
        );
        if (!result) break;
        const [match, prefix, param, regex] = result;
        const optional = match.endsWith('?');
        // Convert :param to capture group
        regexPattern += `${optional ? '(' : ''}${prefix}(?<${param}>${regex ? regex + '(?=$|\/)' : '[^/]+'})${optional ? ')?' : ''}`;
        offset = result.index + match.length;
    }

    return new RegExp(`^${regexPattern}${isPrefix ? '(?=$|\/)' : '$'}`);
}

/**
 * Express 5 path-to-regexp v8 style parser.
 * Supports:
 *   - /:param (named parameters)
 *   - /*splat (named wildcard, captures remaining segments as array-ready)
 *   - /{*splat} (named wildcard that also matches root /)
 *   - /:file{.:ext} (optional groups with braces)
 *   - Escaped special chars with backslash
 * Does NOT support:
 *   - Unnamed wildcards (/* without name)
 *   - Regex chars in path (+, (), [], ?)
 */
function patternToRegexV5(pattern, isPrefix = false) {
    if(pattern instanceof RegExp) {
        return pattern;
    }
    if(isPrefix && pattern === '') {
        return EMPTY_REGEX;
    }

    let regexPattern = '';
    let i = 0;
    const len = pattern.length;

    while(i < len) {
        const ch = pattern[i];

        // Escaped character
        if(ch === '\\' && i + 1 < len) {
            regexPattern += '\\' + pattern[i + 1];
            i += 2;
            continue;
        }

        // Named wildcard: /*name or /{*name}
        if(ch === '/' && i + 1 < len && pattern[i + 1] === '*') {
            // /*splat
            i += 2; // skip /*
            let name = '';
            while(i < len && /\w/.test(pattern[i])) {
                name += pattern[i++];
            }
            if(!name) {
                throw new Error('Wildcard must have a name in Express 5 path syntax. Use /*splat instead of /*');
            }
            // /*splat matches one or more segments after the slash
            regexPattern += `/(?<${name}>.+)`;
            continue;
        }

        if(ch === '{') {
            // Check for {*name} (root-matching wildcard)
            if(pattern[i + 1] === '*') {
                i += 2; // skip {*
                let name = '';
                while(i < len && pattern[i] !== '}') {
                    name += pattern[i++];
                }
                i++; // skip }
                if(!name) {
                    throw new Error('Wildcard must have a name in Express 5 path syntax. Use {*splat}');
                }
                // {*splat} matches zero or more path segments
                // If preceded by /, the slash is already in regexPattern, so match optionally
                if(regexPattern.endsWith('/') || regexPattern.endsWith('\\/')) {
                    // Remove trailing slash from pattern and make the whole /... optional
                    regexPattern = regexPattern.slice(0, regexPattern.endsWith('\\/') ? -2 : -1);
                    regexPattern += `(?:/(?<${name}>.+))?/?`;
                } else {
                    regexPattern += `(?<${name}>.*)`;
                }
                continue;
            }

            // Optional group: {.:ext} or {/subpath}
            i++; // skip {
            let groupContent = '';
            let braceDepth = 1;
            while(i < len && braceDepth > 0) {
                if(pattern[i] === '{') braceDepth++;
                else if(pattern[i] === '}') {
                    braceDepth--;
                    if(braceDepth === 0) break;
                }
                groupContent += pattern[i++];
            }
            i++; // skip closing }

            // Parse the optional group content (may contain :param)
            let groupRegex = '';
            let gi = 0;
            while(gi < groupContent.length) {
                if(groupContent[gi] === ':') {
                    gi++; // skip :
                    let paramName = '';
                    while(gi < groupContent.length && /\w/.test(groupContent[gi])) {
                        paramName += groupContent[gi++];
                    }
                    groupRegex += `(?<${paramName}>[^/]+)`;
                } else if(groupContent[gi] === '.') {
                    groupRegex += '\\.';
                    gi++;
                } else if(groupContent[gi] === '/') {
                    groupRegex += '/';
                    gi++;
                } else {
                    groupRegex += groupContent[gi].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    gi++;
                }
            }
            regexPattern += `(?:${groupRegex})?`;
            continue;
        }

        // Named parameter :param
        if(ch === ':') {
            i++; // skip :
            let name = '';
            while(i < len && /\w/.test(pattern[i])) {
                name += pattern[i++];
            }
            // Look ahead: if followed by {, adjust the param regex to not consume the group delimiter
            if(i < len && pattern[i] === '{') {
                // peek at the first char of the group to determine the delimiter
                const delimiter = pattern[i + 1];
                if(delimiter === '.') {
                    regexPattern += `(?<${name}>[^/.]+)`;
                } else if(delimiter === '/') {
                    regexPattern += `(?<${name}>[^/]+)`;
                } else {
                    regexPattern += `(?<${name}>[^/]+?)`;
                }
            } else {
                regexPattern += `(?<${name}>[^/]+)`;
            }
            continue;
        }

        // Literal characters (escape regex special chars)
        if('.+?^${}()|[]'.includes(ch)) {
            regexPattern += '\\' + ch;
        } else if(ch === '*') {
            // Bare * without name — error in v5
            throw new Error('Wildcard must have a name in Express 5 path syntax. Use /*splat instead of /*');
        } else {
            regexPattern += ch;
        }
        i++;
    }

    return new RegExp(`^${regexPattern}${isPrefix ? '(?=$|/)' : '$'}`);
}

function needsConversionToRegex(pattern) {
    if(pattern instanceof RegExp) {
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

function needsConversionToRegexV5(pattern) {
    if(pattern instanceof RegExp) {
        return false;
    }
    
    return pattern.includes('*') ||
        pattern.includes(':') ||
        pattern.includes('{');
}

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

function canBeOptimizedV5(pattern) {
    if(pattern instanceof RegExp) {
        return false;
    }
    if(
        pattern.includes('*') ||
        pattern.includes('{') ||
        pattern.includes(':')
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

function normalizeType(type) {
    return ~type.indexOf('/') ?
        acceptParams(type) :
        { value: (mime.lookup(type) || 'application/octet-stream'), params: {} };
}

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
    'declarative responses': true,
    'version': 4
};

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

function findIndexStartingFrom(arr, fn, index = 0) {
    for(let i = index, end = arr.length; i < end; i++) {
        if(fn(arr[i], i, arr)) {
            return i;
        }
    }
    return -1;
};

function decode (path) {
    try {
        return decodeURIComponent(path)
    } catch (err) {
        return -1
    }
}

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

function containsDotFile(parts) {
    for(let i = 0, len = parts.length; i < len; i++) {
        const part = parts[i];
        if(part.length > 1 && part[0] === '.') {
            return true;
        }
    }
  
    return false;
}

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


function parseHttpDate(date) {
    const timestamp = date && Date.parse(date);
    return typeof timestamp === 'number' ? timestamp : NaN;
}

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

function createETagGenerator(options) {
    return function generateETag (body, encoding) {
        if(body instanceof Stats) {
            return etag(body, options);
        }
        const buf = !Buffer.isBuffer(body) ? Buffer.from(body, encoding) : body;
        return etag(buf, options);
    }
}

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

function escapeHtml(str) {
    const s = String(str);
    const len = s.length;
    let i = 0;

    // Fast scan: find first char that needs escaping
    for(; i < len; i++) {
        const ch = s.charCodeAt(i);
        if(ch === 0x26 || ch === 0x3C || ch === 0x3E || ch === 0x22 || ch === 0x27) {
            break;
        }
    }

    // No escaping needed
    if(i === len) return s;

    // Build escaped string from the first match onward
    let escaped = s.substring(0, i);

    for(; i < len; i++) {
        const ch = s.charCodeAt(i);
        switch(ch) {
            case 0x26: // &
                escaped += '&amp;';
                break;
            case 0x3C: // <
                escaped += '&lt;';
                break;
            case 0x3E: // >
                escaped += '&gt;';
                break;
            case 0x22: // "
                escaped += '&quot;';
                break;
            case 0x27: // '
                escaped += '&#39;';
                break;
            default:
                escaped += s.charAt(i);
                break;
        }
    }

    return escaped;
}

// fast null object
const NullObject = function() {};
NullObject.prototype = Object.create(null);

module.exports = {
    removeDuplicateSlashes,
    patternToRegex,
    patternToRegexV5,
    needsConversionToRegex,
    needsConversionToRegexV5,
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
    canBeOptimizedV5,
    escapeHtml,
    EMPTY_REGEX
};
