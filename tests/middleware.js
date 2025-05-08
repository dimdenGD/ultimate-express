module.exports = (req, res, next) => {
    const oldEnd = res.end;
    const oldWrite = res.write;
    const chunks = [];
  
    res.write = function (chunk) {
      chunks.push(Buffer.from(chunk));
      return oldWrite.apply(res, arguments);
    };
   
    res.end = function (chunk) {
      if (chunk){
        chunks.push(Buffer.from(chunk));
      }
      
      const reqKeys = [
        "httpVersionMajor",
        "httpVersionMinor",
        "httpVersion",
        "rawHeaders",
        "headers",
        "headersDistinct",
        "url",
        //"ip", ultimate is "0000:0000:0000:0000:0000:0000:0000:0001" express is "::1"
        "ips",
        "protocol",
        // "host",  deprecated
        "hostname",
        "method",
        "baseUrl",
        "originalUrl",
        "params",
        "query",
        "secure",
        "fresh",
        "stale",
        "subdomains",
        "xhr",
        "body",
      ];
      console.log('REQUEST');
      for (const key of reqKeys) {
        console.log('req.' + key, JSON.stringify(req[key])?.toLowerCase());
      }
  
      const resKeys = [
        'statusCode',
        'statusText',
        'writableFinished',
        'headersSent',
      ];
      console.log('RESPONSE');
      for (const key of resKeys) {
        console.log('res.' + key, JSON.stringify(res[key])?.toLowerCase());
      }
      let resHeaders = res.getHeaders();
      delete resHeaders['x-powered-by']; // always different
      delete resHeaders["connection"]; // always different
      delete resHeaders["keep-alive"]; // always different
      delete resHeaders["content-length"]; // not always present on ultimate
      delete resHeaders["etag"]; // default enabled on express

      resHeaders = Object.keys(resHeaders).sort().reduce(function (result, key) {
          result[key] = resHeaders[key];
          return result;
      }, {});
      console.log('res.headers', JSON.stringify(resHeaders));

      if( resHeaders['accept-encoding'] ){
        const body = Buffer.concat(chunks).toString('utf8');
        console.log('res.body', body);
      } else {
        console.log('res.body', 'compressed');
      }

      oldEnd.apply(res, arguments);
    };
    next();
  };