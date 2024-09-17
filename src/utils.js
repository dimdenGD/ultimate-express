import mime from 'mime-types';
import path from 'path';
import proxyaddr from 'proxy-addr';
import qs from 'qs';

export function removeDuplicateSlashes(path) {
    return path.replace(/\/{2,}/g, '/');
}

export function patternToRegex(pattern, isPrefix = false) {
    if(pattern instanceof RegExp) {
        return pattern;
    }
    if(isPrefix && pattern === '/') {
        return new RegExp(``);
    }

    let regexPattern = pattern
        .replace(/\*/g, '.*') // Convert * to .*
        .replace(/:(\w+)/g, (match, param) => {
            return `(?<${param}>[^/]+)`;
        }); // Convert :param to capture group

    return new RegExp(`^${regexPattern}${isPrefix ? '(?=$|\/)' : '$'}`);
}

export function needsConversionToRegex(pattern) {
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
        pattern.includes('}');
}

function acceptParams(str) {
    const parts = str.split(/ *; */);
    const ret = { value: parts[0], quality: 1, params: {} }
  
    for (let i = 1; i < parts.length; ++i) {
      const pms = parts[i].split(/ *= */);
      if ('q' === pms[0]) {
        ret.quality = parseFloat(pms[1]);
      } else {
        ret.params[pms[0]] = pms[1];
      }
    }
  
    return ret;
}

export function normalizeType(type) {
    return ~type.indexOf('/') ?
        acceptParams(type) :
        { value: (mime.lookup(type) || 'application/octet-stream'), params: {} };
}

export function stringify(value, replacer, spaces, escape) {
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

export const defaultSettings = {
    'jsonp callback name': 'callback',
    'env': () => process.env.NODE_ENV ?? 'development',
    'etag': 'weak',
    'query parser': 'extended',
    'query parser fn': () => qs.parse,
    'subdomain offset': 2,
    'trust proxy': false,
    'views': () => path.join(process.cwd(), 'views'),
    'view cache': () => process.env.NODE_ENV === 'production',
    'x-powered-by': true,
    'case sensitive routing': true
};

export function compileTrust(val) {
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
export function deprecated(oldMethod, newMethod, full = false) {
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

Array.prototype.findStartingFrom = function(fn, index = 0) {
    for(let i = index; i < this.length; i++) {
        if(fn(this[i], i, this)) {
            return [i, this[i]];
        }
    }
    return [-1, undefined];
};