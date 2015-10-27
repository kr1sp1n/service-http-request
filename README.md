# service-http-request

[![Codecov](https://img.shields.io/codecov/c/github/kr1sp1n/service-http-request.svg)]()
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Create a HTTP Request [POST]

+ Request (application/json)
+ Parameters
    + uri (string, required) - fully qualified uri
    + method (string, required) - http method
    + headers (object, optional) - http headers
    + body (object, optional) - http body
    + json (boolean, optional) - sets `body` to JSON
