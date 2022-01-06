/*
 * Helpers for various tasks
 *
 */

// Dependencies
let crypto = require('crypto')
let config = require('./config')

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

module.exports = helpers
