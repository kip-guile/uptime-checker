/*
 * Library for storing ans editing data
 *
 */

// Dependencies
let fs = require('fs')
let path = require('path')
let helpers = require('./helpers')

// Container for the module (to be exported)
let lib = {}

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Write data to a file
lib.create = (dir, file, data, callback) => {
  //Open the file for writing
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        let stringData = JSON.stringify(data)

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false)
              } else {
                callback('Error closing new file')
              }
            })
          } else {
            callback('Error writing to new file')
          }
        })
      } else {
        callback('Could not create new file, may already exist')
      }
    }
  )
}

// Read data to a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
    if (!err && data) {
      let parsedData = helpers.parseJSONtoObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)
    }
  })
}

// Update data in existing file
lib.update = (dir, file, data, callback) => {
  // Open file for writing
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        let stringData = JSON.stringify(data)

        // Truncate the file
        fs.ftruncate(fileDescriptor, (err) => {
          if (!err) {
            // Write file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false)
                  } else {
                    callback('Error closing existing file')
                  }
                })
              } else {
                callback('Error writing to new file')
              }
            })
          } else {
            callback('Error truncating file')
          }
        })
      } else {
        callback('could not open file for updating, it may not exist yet')
      }
    }
  )
}

// Delete existing file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
    if (!err) {
      callback(false)
    } else {
      callback('error deleting the file')
    }
  })
}

// List all the items in a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + '/', (err, data) => {
    if (!err && data.length > 0) {
      let trimmedFileNAmes = []
      data.forEach((fileName) => {
        trimmedFileNAmes.push(fileName.replace('.json', ''))
      })
      callback(false, trimmedFileNAmes)
    } else {
      callback(err, data)
    }
  })
}

// Export the module
module.exports = lib