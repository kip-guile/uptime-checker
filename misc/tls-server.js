/*
 * Example TLS Server
 * Listens to port 6000 and sends the word "pong" to clients
 *
 */

// Dependencies
let tls = require('tls')
let fs = require('fs')
let path = require('path')

// Server options
let options = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
}

// Create the server
let server = tls.createServer(options, function (connection) {
  // Send the word "pong"
  let outboundMessage = 'pong'
  connection.write(outboundMessage)

  // When the client writes something, log it out
  connection.on('data', function (inboundMessage) {
    let messageString = inboundMessage.toString()
    console.log(
      'I wrote ' + outboundMessage + ' and they said ' + messageString
    )
  })
})

// Listen
server.listen(6000)
