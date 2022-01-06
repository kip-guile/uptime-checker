/*
 * Primary file for the API
 *
 */

// Dependencies
let http = require('http')
let https = require('https')
let url = require('url')
let StringDecoder = require('string_decoder').StringDecoder
let config = require('./lib/config')
let fs = require('fs')
let _data = require('./lib/data')
let handlers = require('./lib/handlers')
let helpers = require('./lib/helpers')

// Instantiate the HTTP server
let httpServer = http.createServer((req, res) => {
  unifiedServer(req, res)
})

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort}`)
})

// Instantiate the HTTPS server
let httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
}
let httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res)
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort}`)
})

// All the server logic for both the http and the https server
let unifiedServer = (req, res) => {
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
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
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
      // Log the request path
      console.log('Returning this response: ', statusCode, payloadString)
    })
  })
}

// Define a request router
let router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
}
