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

  messages.push(name, JSON.stringify(newHeaders).toLowerCase());
};

const messages = [];
const oldExit = process.exit;
process.exit = function(){
  for(const message of messages){
    console.log(message);
  }
  return oldExit.apply(arguments);
}

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
    messages.push("REQUEST");
    for (const key of reqKeys) {
      messages.push("req." + key, JSON.stringify(req[key])?.toLowerCase());
    }
    messages.push("req.ip", req.ip.replace('0000:0000:0000:0000:0000:0000:0000:000', "::"));
    messages.push("req.params", JSON.stringify(req.params ?? {})?.toLowerCase()); // on express is undefined when no params
    messages.push("req.baseUrl", JSON.stringify(req.baseUrl ?? "")?.toLowerCase()); // on express is undefined

    if (req.headers["content-type"]?.includes("octet-stream")) {
      messages.push("res.body", "stream");
    } else {
      messages.push("req.body", JSON.stringify(req.body)?.toLowerCase());
    }

    logHeaders("req.headers", req.headers);
    logHeaders("req.headersDistinct", req.headersDistinct);

    const resKeys = [
      "statusCode",
      "statusText",
      "writableFinished",
      "headersSent",
    ];
    messages.push("RESPONSE");
    for (const key of resKeys) {
      messages.push("res." + key, JSON.stringify(res[key])?.toLowerCase());
    }
    const resHeaders = res.getHeaders();
    logHeaders("res.headers", resHeaders);

    const size = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    if (resHeaders["accept-encoding"]) {
      messages.push("res.body", "compressed size " + size);
    } else if (
      resHeaders["content-type"]?.toLowerCase() === "application/octet-stream"
    ) {
      messages.push("res.body", "stream size " + size);
    } else {
      const body = Buffer.concat(chunks).toString("utf8");
      messages.push("res.body", body.substring(0, 5_000));
    }
  });

  next();
};
