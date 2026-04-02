wrk.method = "POST"
wrk.path = "/hash-body"
wrk.headers["Content-Type"] = "application/octet-stream"

local mb = 1024 * 1024
local body = string.rep("a", 4 * mb)
wrk.body = body
