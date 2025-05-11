/**
 * fetch for test
 * @param {string | URL | globalThis.Request} input
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
async function fetchTest(input, init) {
  const response = await fetch(input, init);
  console.log("status", response.status);
  console.log("statusText", response.statusText);

  console.log("content-type", response.headers.get("content-type")?.toLowerCase());
  console.log("content-encoding", response.headers.get("content-encoding"));
  console.log("vary", response.headers.get("vary"));
  console.log("set-cookie", typeof response.headers.get("set-cookie"));

  response.headers.forEach((value, key) => {
    if( key.startsWith('x-') ){
        switch (key) {
            case 'x-powered-by': console.log(key, typeof value); break;
            case 'x-content-type-options': break;
            case 'x-ratelimit-reset': break;
            default: console.log(key, value);
        }
    }
  });

  return response;
}

module.exports = {
    fetchTest
}