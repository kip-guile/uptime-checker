/*
 * Example UDP Client
 * Sending a message to a UDP server on port 6000
 *
 */

// Dependencies
let dgram = require('dgram')

// Create the client
let client = dgram.createSocket('udp4')

// Define the message and pull it into a buffer
let messageString = 'This is a message'
let messageBuffer = Buffer.from(messageString)

// Send the message
client.send(messageBuffer, 6000, 'localhost', function (err) {
  client.close()
})
