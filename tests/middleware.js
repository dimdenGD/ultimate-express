const logHeaders = (name, headers) => {
  const newHeaders = Object.keys(headers).sort().reduce((result, key) => {
      result[key] = headers[key];
      return result;
  }, {});
  delete newHeaders['if-modified-since']; // maybe different
  delete newHeaders['x-powered-by']; // always different
  delete newHeaders["connection"]; // always different
  delete newHeaders["keep-alive"]; // always different
  delete newHeaders["content-length"]; // not always present on ultimate
  delete newHeaders["etag"]; // default enabled on express
  delete newHeaders["last-modified"]; // maybe different
  delete newHeaders["date"]; // always different
  console.log(name, JSON.stringify(newHeaders).toLowerCase());
};

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
        //"rawHeaders", tested after
        //"headers", tested after
        //"headersDistinct", tested after
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

      logHeaders('req.headers', req.headers);
      logHeaders('req.headersDistinct', req.headersDistinct);
  
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
      const resHeaders = res.getHeaders();
      logHeaders('res.headers', resHeaders);

      if( resHeaders['accept-encoding'] ){
        console.log('res.body', 'compressed');
      } else {
        const body = Buffer.concat(chunks).toString('utf8');
        console.log('res.body', body);
      }

      oldEnd.apply(res, arguments);
    };
    next();
  };