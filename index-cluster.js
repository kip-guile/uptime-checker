/*
 * Primary file for API
 *
 */

// Dependencies
let server = require('./lib/server')
let workers = require('./lib/workers')
let cli = require('./lib/cli')
let cluster = require('cluster') // allow us to spawn our server to use different cores
let os = require('os')

// Declare the app
let app = {}

// Init function
app.init = function (callback) {
  // If we're on the master thread, start the background workers and the CLI
  if (cluster.isMaster) {
    // Start the workers
    workers.init()

    // Start the CLI, but make sure it starts last
    setTimeout(function () {
      cli.init()
      callback()
    }, 50)

    // Fork the process
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork()
    }
  } else {
    // If we're not on the master thread, start the HTTP server
    server.init()
  }
}

// Self invoking only if required directly
if (require.main === module) {
  app.init(function () {})
}

// Export the app
module.exports = app
