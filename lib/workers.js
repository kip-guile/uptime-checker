/*
 * Worker related tasks
 *
 */

// Dependencies
let path = require('path')
let fs = require('fs')
let _data = require('./data')
let http = require('http') // allow us to create new servers and listen on ports, also make outbound requests
let https = require('https') // allow us to create new servers and listen on ports securely, also make outbound requests
let helpers = require('./helpers')
let url = require('url') // used it to parse hostname and other things from a url
let _logs = require('./logs')
let util = require('util') // used to setup node_debug regime
let debug = util.debuglog('workers') // use NODE_DEBUG=workers node index.js to see errors in this file

// Instantiate the worker object
let workers = {}

// Look up all checks, get their data, send to a validator
workers.gatherAllChecks = () => {
  // Get all the checks
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        // Read in the check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // Pass it to the check validator, and let that fuction continue or log errors as needed
            workers.validateCheckData(originalCheckData)
          } else {
            debug({
              Error: 'Error reading one of the checks data',
            })
          }
        })
      })
    } else {
      debug({ Error: 'Could not find any checks to process' })
    }
  })
}

// Sanity-check the check-data
workers.validateCheckData = (originalCheckData) => {
  originalCheckData =
    typeof originalCheckData === 'object' && originalCheckData !== null
      ? originalCheckData
      : {}
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone === 'string' &&
    originalCheckData.userPhone.trim().length === 10
      ? originalCheckData.userPhone.trim()
      : false
  originalCheckData.id =
    typeof originalCheckData.id === 'string' &&
    originalCheckData.id.trim().length === 20
      ? originalCheckData.id.trim()
      : false
  originalCheckData.protocol =
    typeof originalCheckData.id === 'string' &&
    ['http', 'https'].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false
  originalCheckData.url =
    typeof originalCheckData.url === 'string' &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false
  originalCheckData.method =
    typeof originalCheckData.method === 'string' &&
    ['get', 'post', 'delete', 'put'].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes === 'object' &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === 'number' &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false

  // Set keys that may not be set if the workers have never seen this check before
  originalCheckData.state =
    typeof originalCheckData.state === 'string' &&
    ['up', 'down'].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : 'down'
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === 'number' &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false

  // If all the checks pass, pass the data along to the next step in the process
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData)
  } else {
    debug('one of the checks is not properly formatted, skipping it...')
  }
}

// Perfrorm check, send the original check data and the outcome of the check data to the next step in the process
workers.performCheck = (originalCheckData) => {
  // Prepare the original check outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  }

  // Mark that the outcome has not been sent yet
  let outcomeSent = false

  // Parse the hostname and path out of the original check data
  let parsedUrl = url.parse(
    originalCheckData.protocol + '://' + originalCheckData.url,
    true
  )
  let hostName = parsedUrl.hostname
  let path = parsedUrl.path // Using path and not 'pathname', because we want the query string

  // Construct the request
  let requestDetails = {
    protocol: originalCheckData.protocol + ':',
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  }

  // Instantiaite the request object (using either the http or https module)
  let _moduleToUse = originalCheckData.protocol === 'http' ? http : https
  let req = _moduleToUse.request(requestDetails, (res) => {
    // Grab status of sent request
    let status = res.statusCode

    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // Bind to the error event so it doesnt get thrown
  req.on('error', (e) => {
    // Updatw the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: e,
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // Bind to the timeout event
  req.on('timeout', (e) => {
    // Updatw the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: timeout,
    }
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome)
      outcomeSent = true
    }
  })

  // End the request
  req.end()
}

// Process the check outcome, and update the check data as needed, then trigger alert to the use, if needed
// Special logic for accomodating a check that has never been tested before (dont alert on that one)
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // Decide if the check is considered up or down
  let state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? 'up'
      : 'down'

  // Decide if an alert is warranted
  let alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false

  // Log the outcome
  let timeOfCheck = Date.now()
  workers.log(
    originalCheckData,
    checkOutcome,
    state,
    alertWarranted,
    timeOfCheck
  )

  // update the check data
  let newCheckData = originalCheckData
  newCheckData.state = state
  newCheckData.lastChecked = Date.now()

  // Save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // Send the new check data to the next phase of the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData)
      } else {
        debug('check outcome hasnt changed, no alert needed')
      }
    } else {
      debug('Error trying to save updates to one of the checks')
    }
  })
}

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = (newCheckData) => {
  let msg = `Alert Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.ur} is currently ${newCheckData.state}`
  helpers.sendTwilioSMS(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      debug(
        'Success: user was alerted to a status change in ther check, via sms:',
        msg
      )
    } else {
      debug(
        'Error: could not send out an sms alert to user who had a state change in their check'
      )
    }
  })
}

workers.log = (
  originalCheckData,
  checkOutcome,
  state,
  alertWarranted,
  timeOfCheck
) => {
  // Form the log data
  let logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state: state,
    alert: alertWarranted,
    time: timeOfCheck,
  }

  // Convert data to a string
  let logString = JSON.stringify(logData)

  // Determinr the name of the log file
  let logFileName = originalCheckData.id

  // Append the log file to the file
  _logs.append(logFileName, logString, (err) => {
    if (!err) {
      debug('Logging to the file succeeded')
    } else {
      debug('Logging to the file failed')
    }
  })
}

// Timer to execute the worker process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks()
  }, 1000 * 60)
}

// Rotate (compress) the log files
workers.rotateLogs = () => {
  // List all the (non compressed) log files
  _logs.list(false, (err, logs) => {
    if (!err && logs && logs.length > 0) {
      logs.forEach((logName) => {
        // Compress the data to a different file
        let logId = logName.replace('.log', '')
        let newFileId = logId + '-' + Date.now()
        _logs.compress(logId, newFileId, (err) => {
          if (!err) {
            // Truncate the log
            _logs.truncate(logId, (err) => {
              if (!err) {
                debug('Success truncating logFile')
              } else {
                debug('Error truncating logFile')
              }
            })
          } else {
            debug('Error compressing one of the log files', err)
          }
        })
      })
    } else {
      debug('Error: could not find any logs to rotate')
    }
  })
}

// Timer to execute log rotation process once pr day
workers.logRotationLoop = () => {
  setInterval(() => {
    workers.rotateLogs()
  }, 1000 * 60 * 60 * 24)
}

// Init script
workers.init = () => {
  // Send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')
  // Execute all the checks immediately
  workers.gatherAllChecks()

  // Call the loop so the check will execute later on
  workers.loop()

  // Compress all the logs immediately
  workers.rotateLogs()

  // Call the compression loop so logs will be compressed later on
  workers.logRotationLoop()
}

// Export the module
module.exports = workers
