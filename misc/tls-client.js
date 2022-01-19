/*
 * Example TLS client
 * Connects to port 6000 and sends the word "ping" to servers
 *
 */

// Dependencies
let tls = require('tls')
let fs = require('fs')
let path = require('path')

// Define the message to send
let outboundMessage = 'ping'

// Client options
let options = {
  ca: [fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))], // Only required because we're using a self-signed cert)
}

// Create the client
let client = tls.connect(6000, options, function () {
  // Send the message
  client.write(outboundMessage)
})

// When the server writes back, log what it says then kill the client
client.on('data', function (inboundMessage) {
  let messageString = inboundMessage.toString()
  console.log('I wrote ' + outboundMessage + ' and they said ' + messageString)
  client.end()
})
