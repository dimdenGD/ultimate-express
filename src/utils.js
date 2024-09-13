import mime from 'mime-types';

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