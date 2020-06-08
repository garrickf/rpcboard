/** server.js
 *
 * The central log server accepts connections that stream it log data, as well
 * as serving the frontend.
 *
 * Sources:
 * MDN web docs: https://developer.mozilla.org/en-US/docs/
 * Express docs: https://expressjs.com/en/4x/api.html
 */

// const HOSTNAME = "localhost";
const SERVE_PORT = 6006;

const net = require("net"); // For lower-lever management of sockets
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const express = require("express");

const Parser = require("./parser");
const Spanner = require("./spanner");
const TreeGenerator = require("./treeGenerator");

console.log("Starting rpcboard...\n");

// Create HTTP server and listen on port 3000 for requests
const app = express();

const APP_DIR = "../frontend/build";

// Use express.static built-in middleware for serving static files
app.use(express.static(path.join(__dirname, APP_DIR)));

// Express routes
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, APP_DIR, "index.html"))
);

app.get("/api/data/", (req, res) => {
  // Alt: res.json(data);
  res.header("Content-Type", "application/json");
  res.sendFile(path.join(__dirname, "data", "run1.json"));
});
// TODO: ability to query all files in data directory? Ability to query one
// file at a time, by name?

app.listen(SERVE_PORT, () => {
  console.log(`Server running on http://localhost:${SERVE_PORT}/`);
  console.log(`\tGo to http://localhost:${SERVE_PORT}/ to see rpcboard.`);
});

const spanner = new Spanner();
const treeGenerator = new TreeGenerator(spanner);

treeGenerator.onTreeUpdate((tree) => {
  console.log("Tree update:");
  treeGenerator.prettyPrintSelf();

  // TODO: rewrite JSON file to file out
  createDataDirectory("./data");
  writeFile("./data/run1.json", treeGenerator.toJSON());
});

// Listen for client connections on another port, these are streaming data to us
const logServer = net
  .createServer((socket) => {
    const readInterface = readline.createInterface({
      input: socket,
      output: socket,
      console: false,
    });

    // Create parser around read interface
    const parser = new Parser(readInterface);
    spanner.addParser(parser);
    // parser.onLogEvent((event) => {
    //   console.log(event);
    // });
    parser.start();

    socket.addListener("connect", function () {
      console.log("Client connected: " + this.remoteAddress);
    });

    // TODO: add parser to a combined utility that cross-references and combines
    // log events into spans
  })
  .on("error", (err) => {
    // Handle errors here.
    throw err;
  });

// Grab an arbitrary unused port.
const PORT = 7007;
logServer.listen(PORT, () => {
  console.log(`Now accepting log connections on http://localhost:${PORT}/`);
  console.log(
    `Feed your distributed app's logs into rpcboard by running the following:`
  );
  console.log(`\trpcboard-trace -p ${PORT} [command ...]`);
  // NOTE: can call logServer.address()
});

// NOTE: use JS async/await to create directory, write out file
// see https://stackoverflow.com/questions/4482686/check-synchronously-if-file-directory-exists-in-node-js
const createDataDirectory = async (dirname) => {
  try {
    await fs.promises.mkdir(dirname);
  } catch (error) {
    if (error.code !== "EEXIST") {
      // Some other error than directory already exists
      console.log(error);
    }
  }
};

const writeFile = async (filename, data) => {
  try {
    // writeFile will truncate file if it exists
    await fs.promises.writeFile(filename, data);
  } catch (error) {
    console.log(error);
  }
};

// TODO: function that deletes data directory on start (convenience)

// TODO: make server listen for stream connections, take logs and parse them
// From logs, pull log events and construct spans
// p = parser(stream);
// setInterval(p.pullLogEventsAndAddToSpanConstructor() , 1000)

// Tree constructor: every 1s, take in spans from queue and match into trees
// Every so often, we poll for the tree graph from the tree, given all the log events
