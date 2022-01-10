/*
 * Server related tasks
 *
 */

// Dependencies
let http = require('http')
let https = require('https')
let url = require('url')
let StringDecoder = require('string_decoder').StringDecoder // used it to get the payload parsed
let config = require('./config')
let fs = require('fs')
let handlers = require('./handlers')
let helpers = require('./helpers')
let path = require('path')
let util = require('util')
let debug = util.debuglog('server') // use NODE_DEBUG=server node index.js to see errors in this file

// Instantiate the server module object
let server = {}

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res)
})

// Instantiate the HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, './../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, './../https/cert.pem')),
}

server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res)
  }
)

// All the server logic for both the http and the https server
server.unifiedServer = (req, res) => {
  // Get the URL and parse it
  let parsedUrl = url.parse(req.url, true)

  //Get the path
  let path = parsedUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  let queryStringObject = parsedUrl.query

  // Get the HTTP Method
  let method = req.method.toLowerCase()

  // Get the headers as an object
  let headers = req.headers

  // Get the payload, if any
  let decoder = new StringDecoder('utf-8')
  /*
  in node, data (payload) comes in streams, so we
  want to keep listening for the payload and appending
  it to the buffer string as it comes. Then when it completes,
  we push everything to the buffer.
  */
  let buffer = ''
  req.on('data', (data) => {
    buffer += decoder.write(data)
  })
  req.on('end', () => {
    buffer += decoder.end()

    //Choose ethe handler request should go to. If not found, use not found handler
    let chosenHandler =
      typeof server.router[trimmedPath] !== 'undefined'
        ? server.router[trimmedPath]
        : handlers.notFound

    //construct data object to send to the handler
    let data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJSONtoObject(buffer),
    }

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200
      // Use the payload called back by the handler or default to {}
      payload = typeof payload === 'object' ? payload : {}
      // Convert the payload to a string
      let payloadString = JSON.stringify(payload)
      //Return the response
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(statusCode)
      res.end(payloadString)
      // If the response is 200, print green else print red
      if (statusCode === 200) {
        debug(
          '\x1b[32m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode
        )
      } else {
        debug(
          '\x1b[31m%s\x1b[0m',
          method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode
        )
      }
    })
  })
}

// Define a request router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
}

server.init = () => {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `The HTTP server is listening on port ${config.httpPort}`
    )
  })
  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      '\x1b[35m%s\x1b[0m',
      `The HTTP server is listening on port ${config.httpPort}`
    )
  })
}

module.exports = server
