/*
 * Helpers for various tasks
 *
 */

// Dependencies
let crypto = require('crypto') // used to hash passwords
let config = require('./config')
let querystring = require('querystring') // used to take a url string and explode it into an object
let https = require('https')

// Container for helpers
let helpers = {}

// Creata a SHA256 hash
helpers.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    let hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex')
    return hash
  } else {
    return false
  }
}

// Parse a JSON string to an object in all cases without throwing
helpers.parseJSONtoObject = (str) => {
  try {
    let obj = JSON.parse(str)
    return obj
  } catch (e) {
    return {}
  }
}

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false
  if (strLength) {
    let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'

    // Start the final string
    let str = ''
    for (let i = 1; i <= strLength; i++) {
      // Get a random character from possibleCharaters string
      let randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      )

      // Append this character to the final string
      str += randomCharacter
    }

    // Return thefinal string
    return str
  } else {
    return false
  }
}

// Send an SMS via Twilio
helpers.sendTwilioSMS = (phone, msg, callback) => {
  phone =
    typeof phone === 'string' && phone.trim().length === 10
      ? phone.trim()
      : false
  msg =
    typeof msg === 'string' &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg.trim()
      : false

  if (phone && msg) {
    // Configure the request payload
    let payload = {
      From: config.twilio.fromPfone,
      To: +(+1) + phone,
      Body: msg,
    }

    // Stringify the payload
    // let stringPayload = querystring.stringify(payload)
    let stringPayload = new URLSearchParams(payload)
    stringPayload = stringPayload.toString()

    // COnfigure the request details
    let requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path:
        '/2010=04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      auth: config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    }

    // instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // Grab status of the sent request
      let status = res.statusCode
      // Callback successfuly if request goes through
      if (status === 200 || status === 201) {
        callback(false)
      } else {
        callback('status code was returned as ' + status)
      }
    })

    // Bind to the error event so it doesnt get thrown
    req.on('error', (e) => {
      callback(e)
    })

    // Add the payload
    req.write(stringPayload)

    // End the request
    req.end()
  } else {
    callback('Given params were missen or invalid')
  }
}

module.exports = helpers
