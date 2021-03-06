/* eslint-env node */
'use strict';

// # Configuration Resolver
//
// This module loads configuration from the process environment and any user-provided
// ”contexts”. It is designed to let you declaratively state the sources of configuration
// and have it resolved into a single object, enabling you to inject it – in full or as
// subsets – wherever you choose. The point of this is to read configuration in one
// place, and easily see where it is used.

let ConfigResolver = exports;

const dotenv = require('dotenv');
const {intersection, omit, reduce} = require('lodash');

const {logger} = require('./logging');

// Returns an object with the full configuration for an application, based on the given
// `spec`, mapping configuration variables to sources. The `spec` parameter might look as
// follows.
//
// ```js
// {
//   _options: {
//     loadEnvFile: false
//   },
//   _context: {
//     _cfenv: cfenv.getAppEnv() // for a Cloud Foundry app
//   },
//   httpServer: {
//     bindingHost: {_cfenv: 'bind'},
//     port: {_cfenv: 'port'},
//     url: {_cfenv: 'url'}
//   },
//   logLevel: {_env: 'LOG_LEVEL'}
// }
// ```
ConfigResolver.create = function (spec) {
  const options = spec._options || {};

  if (options.loadEnvFile) {
    dotenv.config();
  }

  const context = Object.assign({_env: process.env}, spec._context),
    config = spec._injectedConfig || resolveSpec(omit(spec, '_context', '_options'), context);

  logger.trace(config, 'resolved config');

  return config;
};

// Recurses through the `spec`, fetching values from the `context`. Currently, only
// non-nested contexts are supported.
function resolveSpec(spec, context) {
  return reduce(spec, (config, value, key) => {
    const [contextKey] = intersection(Object.keys(value), Object.keys(context));
    if (contextKey) {
      const contextValue = context[contextKey][value[contextKey]];

      if (typeof contextValue == 'undefined' && typeof value._default == 'undefined') {
        throw new Error(`${value[contextKey]} not found`);
      }

      if (typeof contextValue == 'undefined') {
        config[key] = value._default;
      } else {
        config[key] = maybeDeserialise(value._format, contextValue);
      }
    } else {
      config[key] = resolveSpec(value, context);
    }
    return config;
  }, {});
}

function maybeDeserialise(format, value) {
  const deserialisers = {'JSON': JSON.parse};
  return (deserialisers[format] || (x => x))(value);
}
