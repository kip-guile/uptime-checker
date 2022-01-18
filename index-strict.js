'use strict'

/*
 * Primary file for the API
 * node --use_srict index-strict.js
 */

// Dependencies
let server = require('./lib/server')
let workers = require('./lib/workers')
let cli = require('./lib/cli')

// Declare the app
let app = {}

// Declaring a global (strict should catch this mistake)
foo = 'bar'

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
