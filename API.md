FORMAT: 1A

# HTTP Request Service
A simple API to do HTTP requests.

## Docs
When you do a GET request to `/` the API docs are generated on-the-fly by [Aglio](https://github.com/danielgtaylor/aglio).


# Data Structures

# Group HTTP Request

## HTTP Request [/]

### Create New HTTP Request [POST]
Create a new HTTP request using request options and an optional callback structure.

+ Request with body (application/json)

    + Body

            {
                "uri": "http://api.openweathermap.org/data/2.5/weather?q=Berlin,de&APPID=17c0cad467ddc9c450e3cce9ccf70d3f",
                "callbacks": {
                  "200": {
                    "uri": "http://my-callback-service.com/"
                  }
                }
            }

+ Response 201
