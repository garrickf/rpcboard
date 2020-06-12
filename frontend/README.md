# frontend

Front end related code.

## Building React app

To build the app, `cd` to the `/packages/client` directory and run:

```
npm run-script build
```

This creates a production-ready build of the front end and moves it to the top level of `frontend` so it can be served by `server.js` in `/backend`.

## Developing

To develop using hot-reloading, run:

```
npm start
```

This will start an instance for development at [localhost:3000](http://localhost:3000/). The `package.json` is set up to proxy API requests to the server on its default port `6006`, so when developing, be careful not to change the port you're serving from! (TODO: allow changing port).

When developing, you'll want to have the server spun up as well!

### Using Lerna

Lerna is a tool to manage multiple Javascript packages in a single monorepo. This is done to separate the client application and the visualization library it uses.

