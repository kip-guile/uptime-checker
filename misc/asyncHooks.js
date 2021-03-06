/*
 * Async Hooks Example
 *
 *
 */

// Dependencies
let async_hooks = require('async_hooks') // Track lifecycle of async processes
let fs = require('fs')

// Target execution context
let targetExecutionContext = false

// Write an arbitrary async function
let whatTimeIsIt = function (callback) {
  setInterval(function () {
    fs.writeSync(
      1,
      'When the setInterval runs, the execution context is ' +
        async_hooks.executionAsyncId() +
        '\n'
    )
    callback(Date.now())
  }, 1000)
}

// Call that function
whatTimeIsIt(function (time) {
  fs.writeSync(1, 'The time is ' + time + '\n')
})

// Hooks
let hooks = {
  init(asyncId, type, triggerAsyncId, resource) {
    fs.writeSync(1, 'Hook init ' + asyncId + '\n')
  },
  before(asyncId) {
    fs.writeSync(1, 'Hook before ' + asyncId + '\n')
  },
  after(asyncId) {
    fs.writeSync(1, 'Hook after ' + asyncId + '\n')
  },
  destroy(asyncId) {
    fs.writeSync(1, 'Hook destroy ' + asyncId + '\n')
  },
  promiseResolve(asyncId) {
    fs.writeSync(
      1,
      'Hook promiseResolve. ' +
        asyncId +
        ' This isnt applicable to our context, and should never get called here\n'
    )
  },
}

// Create a new AsyncHook instance. All of these callbacks are optional.
let asyncHook = async_hooks.createHook(hooks)
asyncHook.enable()
