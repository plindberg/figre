# figre

The name comes from ”config resolution” (con-*fig re*-solution).

Following *[The Twelve-Factor App](http://12factor.net)*, we like to keep the configuration for an app in its environment. Not in files that are checked into Git. Definitely not inline in the code.

To keep things tidy and clear, we want to declaratively map the config to the environment variables, in a single spot, and inject it into the parts of the code that need it.

Some platforms, like Cloud Foundry, has an extended environment, where bound services can be looked up. This package allows mapping your config to that as well.

See this example:

```js
const ConfigResolver = require('figre/resolver'),
  cfenv = require('cfenv').getAppEnv(),
  config = ConfigResolver.create({
    _options: {
      loadEnvFile: cfenv.isLocal
    },
    _context: {
      _cfenv: cfenv
    },
    httpServer: {
      port: {_cfenv: 'port'},
      url: {_cfenv: 'url'}
    },
    auth: {
      transactions: {
        jwtSecret: {_env: 'JWT_SECRET_TRANSACTIONS'}
      }
    }
  });
```

This would go early in your `app.js`. It maps the config `auth.transactions.jwtSecret` to the environment variable `JWT_SECRET_TRANSACTIONS`. Also, it adds the Cloud Foundry environment and maps the port and URL for the HTTP server.