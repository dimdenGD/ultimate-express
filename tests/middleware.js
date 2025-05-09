const logHeaders = (name, headers) => {
  const newHeaders = Object.keys(headers).sort().reduce((result, key) => {
    result[key] = JSON.stringify(headers[key]);
    return result;
  }, {});

  delete newHeaders["if-modified-since"]; // maybe different
  delete newHeaders["x-powered-by"]; // always different
  delete newHeaders["connection"]; // always different
  delete newHeaders["keep-alive"]; // always different
  delete newHeaders["content-length"]; // not always present on ultimate
  delete newHeaders["etag"]; // default enabled on express
  delete newHeaders["last-modified"]; // maybe different
  delete newHeaders["date"]; // always different
  delete newHeaders["set-cookie"]; // always different

  if (newHeaders["content-type"]?.includes("multipart/form-data; boundary=")) {
    newHeaders["content-type"] = "multipart/form-data; boundary=";
  }

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
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    oldEnd.apply(res, arguments);
  };

  res.once("close", function () {
    const reqKeys = [
      "httpVersionMajor",
      "httpVersionMinor",
      "httpVersion",
      //"rawHeaders", tested after
      //"headers", tested after
      //"headersDistinct", tested after
      "url",
      //"ip", tested after
      "ips",
      "protocol",
      // "host",  deprecated
      "hostname",
      "method",
      // "baseUrl", tested after
      "originalUrl",
      // "params", tested after
      "query",
      "secure",
      "fresh",
      "stale",
      "subdomains",
      "xhr",
      // "body", tested after
    ];
    console.log("REQUEST");
    for (const key of reqKeys) {
      console.log("req." + key, JSON.stringify(req[key])?.toLowerCase());
    }
    console.log("req.ip", req.ip.replace('0000:0000:0000:0000:0000:0000:0000:000', "::"));
    console.log("req.params", JSON.stringify(req.params ?? {})?.toLowerCase()); // on express is undefined when no params
    console.log("req.baseUrl", JSON.stringify(req.baseUrl ?? "")?.toLowerCase()); // on express is undefined

    if (req.headers["content-type"]?.includes("octet-stream")) {
      console.log("res.body", "stream");
    } else {
      console.log("req.body", JSON.stringify(req.body)?.toLowerCase());
    }

    logHeaders("req.headers", req.headers);
    logHeaders("req.headersDistinct", req.headersDistinct);

    const resKeys = [
      "statusCode",
      "statusText",
      "writableFinished",
      "headersSent",
    ];
    console.log("RESPONSE");
    for (const key of resKeys) {
      console.log("res." + key, JSON.stringify(res[key])?.toLowerCase());
    }
    const resHeaders = res.getHeaders();
    logHeaders("res.headers", resHeaders);

    const size = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    if (resHeaders["accept-encoding"]) {
      console.log("res.body", "compressed size " + size);
    } else if (
      resHeaders["content-type"]?.toLowerCase() === "application/octet-stream"
    ) {
      console.log("res.body", "stream size " + size);
    } else {
      const body = Buffer.concat(chunks).toString("utf8");
      console.log("res.body", body.substring(0, 5_000));
    }
  });

  next();
};
