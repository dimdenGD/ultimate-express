wrk.method = "POST"
wrk.path = "/abc"
wrk.headers["Content-Type"] = "application/x-www-form-urlencoded"

local body = "name=ultimate&value=express&feature=benchmark&count=12345"
wrk.body = body
