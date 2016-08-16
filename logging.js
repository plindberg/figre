/* eslint-env node */
'use strict';

const {scope} = require('logrule/package-logging');

const loggingSetup = scope('co.monies.configresolver');

// Export `use()` function, allowing the using party to select which logger to use. This
// is optional and if not selected a null logger will be used.
exports.use = loggingSetup.use;

// Export the logger used within this package.
exports.logger = loggingSetup.logger;
