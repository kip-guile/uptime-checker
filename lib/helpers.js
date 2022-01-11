/*
 * Helpers for various tasks
 *
 */

// Dependencies
let crypto = require('crypto') // used to hash passwords
let config = require('./config')
let querystring = require('querystring') // used to take a url string and explode it into an object
let https = require('https')
let path = require('path')
let fs = require('fs')

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

// Get the string content of a template
helpers.getTemplate = (templateName, data, callback) => {
  templateName =
    typeof templateName === 'string' && templateName.length > 0
      ? templateName
      : false
  data = typeof data === 'object' && data !== null ? data : {}
  if (templateName) {
    let templatesDir = path.join(__dirname, '/../templates/')
    fs.readFile(templatesDir + templateName + '.html', 'utf-8', (err, str) => {
      if (!err && str && str.length > 0) {
        // Do interpolation on the sting
        let finalString = helpers.interpolate(str, data)
        callback(false, finalString)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('A valid template name was not specified')
  }
}

// Add the universal header and footer to a string and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = (str, data, callback) => {
  str = typeof str === 'string' && str.length > 0 ? str : ''
  data = typeof data === 'object' && data !== null ? data : {}
  // Get the header
  helpers.getTemplate('_header', data, (err, headerString) => {
    if (!err && headerString) {
      // Get the footer
      helpers.getTemplate('_footer', data, (err, footerString) => {
        if (!err && footerString) {
          // Add them all together
          let fullString = headerString + str + footerString
          callback(false, fullString)
        } else {
          callback('could not find the footer template')
        }
      })
    } else {
      callback('could not find the header template')
    }
  })
}

// Take a given string and data object and find/replace all the keys within it
helpers.interpolate = (str, data) => {
  str = typeof str === 'string' && str.length > 0 ? str : ''
  data = typeof data === 'object' && data !== null ? data : {}

  // Add the template globals to the global object, prepending their name with "global"
  for (let keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data['global.' + keyName] = config.templateGlobals[keyName]
    }
  }

  for (let key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
      let replace = data[key]
      let find = '{' + key + '}'
      str = str.replace(find, replace)
    }
  }

  return str
}

// Get the contents of a static (public) asset
helpers.getStaticAsset = (fileName, callback) => {
  fileName =
    typeof fileName === 'string' && fileName.length > 0 ? fileName : false
  if (fileName) {
    let publicDir = path.join(__dirname, '/../public/')
    fs.readFile(publicDir + fileName, (err, data) => {
      if (!err && data) {
        callback(false, data)
      } else {
        callback('no file could be found')
      }
    })
  }
}

module.exports = helpers
