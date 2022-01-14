/*
 * Primary file for the API
 *
 */

// Dependencies
let server = require('./lib/server')
let workers = require('./lib/workers')
let cli = require('./lib/cli')

// Declare the app
let app = {}

// Initialization function
app.init = () => {
  // Start the server
  server.init()
  // Start the workers
  workers.init()

  setTimeout(() => {
    cli.init()
  }, 50)
}

// Execute
app.init()

//Export the app
module.exports = app
