/*
 * Create and export config variables
 *
 */

// Container for all the environments
let environments = {}

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsAlittleSEcret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACc16b7085777a6aea63d88055daccdf51',
    authToken: 'f5498faa5cb02e7694575c0618332f81',
    fromPhone: '+15005550006',
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'Not a real company, Inc.',
    yearCreated: '2022',
    baseUrl: 'http://localhost:3000/',
  },
}

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'thisIsAfatSEcret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACc16b7085777a6aea63d88055daccdf51',
    authToken: 'f5498faa5cb02e7694575c0618332f81',
    fromPhone: '+15005550006',
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'Not a real company, Inc.',
    yearCreated: '2022',
    baseUrl: 'http://localhost:5000/',
  },
}

// Determine which environment was passed as a command line argument
let currentEnvironment =
  typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : ''

// Check that the current environment is one of the environments above, if not, default to staging
let environmentToExport =
  typeof environments[currentEnvironment] === 'object'
    ? environments[currentEnvironment]
    : environments.staging

// Export the module
module.exports = environmentToExport
