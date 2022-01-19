/*
 * Example TCP (Net) Server
 * Listens to port 6000 and sends the word "pong" to clients
 *
 */

// Dependencies
let net = require('net')

// Create the server
let server = net.createServer(function (connection) {
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
