/*
 * Library for storing and rotating logs
 *
 */

// Dependencies
let fs = require('fs')
let path = require('path')
let zlib = require('zlib')

// Container for module (to be exported)
let lib = {}

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.logs/')

// Append a string to a file. Create the file if it does not exist
lib.append = function (file, str, callback) {
  // Open the file for appending
  fs.open(lib.baseDir + file + '.log', 'a', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Append to file and close it
      fs.appendFile(fileDescriptor, str + '\n', function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false)
            } else {
              callback('Error closing file that was being appended')
            }
          })
        } else {
          callback('Error appending to file')
        }
      })
    } else {
      callback('Could open file for appending')
    }
  })
}

// List all the logs, and optionally include the compressed logs
lib.list = function (includeCompressedLogs, callback) {
  fs.readdir(lib.baseDir, function (err, data) {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = []
      data.forEach(function (fileName) {
        // Add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''))
        }

        // Add the .gz files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''))
        }
      })
      callback(false, trimmedFileNames)
    } else {
      callback(err, data)
    }
  })
}

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function (logId, newFileId, callback) {
  let sourceFile = logId + '.log'
  let destFile = newFileId + '.gz.b64'

  // Read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', function (err, inputString) {
    if (!err && inputString) {
      // Compress the data using gzip
      zlib.gzip(inputString, function (err, buffer) {
        if (!err && buffer) {
          // Send the data to the destination file
          fs.open(lib.baseDir + destFile, 'wx', function (err, fileDescriptor) {
            if (!err && fileDescriptor) {
              // Write to the destination file
              fs.writeFile(
                fileDescriptor,
                buffer.toString('base64'),
                function (err) {
                  if (!err) {
                    // Close the destination file
                    fs.close(fileDescriptor, function (err) {
                      if (!err) {
                        callback(false)
                      } else {
                        callback(err)
                      }
                    })
                  } else {
                    callback(err)
                  }
                }
              )
            } else {
              callback(err)
            }
          })
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

// Decompress the contents of a .gz file into a string letiable
lib.decompress = function (fileId, callback) {
  let fileName = fileId + '.gz.b64'
  fs.readFile(lib.baseDir + fileName, 'utf8', function (err, str) {
    if (!err && str) {
      // Inflate the data
      let inputBuffer = Buffer.from(str, 'base64')
      zlib.unzip(inputBuffer, function (err, outputBuffer) {
        if (!err && outputBuffer) {
          // Callback
          let str = outputBuffer.toString()
          callback(false, str)
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

// Truncate a log file
lib.truncate = function (logId, callback) {
  fs.truncate(lib.baseDir + logId + '.log', 0, function (err) {
    if (!err) {
      callback(false)
    } else {
      callback(err)
    }
  })
}

// Export the module
module.exports = lib

// CLI MANUAL
//  exit                                        Kill the CLI (and the rest of the application)
//  man                                         Show this help page
//  help                                        Alias of the "man" command
//  stats                                       Get statistics on the underlying operating system and resource utilization
//  List users                                  Show a list of all the registered (undeleted) users in the system
//  More user info --{userId}                   Show details of a specified user
//  List checks --up --down                     Show a list of all the active checks in the system, including their state. The "--up" and "--down flags are both optional."
//  More check info --{checkId}                 Show details of a specified check
//  List logs                                   Show a list of all the log files available to be read (compressed and uncompressed)
//  More log info --{logFileName}               Show details of a specified log file
