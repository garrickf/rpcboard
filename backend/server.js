/** server.js
 * 
 * The central log server accepts connections that stream it log data, as well
 * as serving the frontend.
 * 
 * Sources:
 * MDN web docs: TODO: get link
 */

const http = require("http"); // Load HTTP module
const HOSTNAME = "localhost";
const SERVE_PORT = 6006;

const net = require("net"); // For lower-lever management of sockets
const readline = require("readline");

const Parser = require("./parser");

// Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {
  // Set the response HTTP header with HTTP status and Content type
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

// Listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(SERVE_PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${SERVE_PORT}/`);
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
    parser.onLogEvent((event) => {
      console.log(event);
    })
    parser.start();

    socket.addListener("connect", function () {
      console.log("client connected: " + this.remoteAddress);
    });

    // TODO: add parser to a combined utility that cross-references and combines
    // log events into spans
  })
  .on("error", (err) => {
    // Handle errors here.
    throw err;
  });

// Grab an arbitrary unused port.
logServer.listen(7007, HOSTNAME, () => {
  console.log("opened server on", logServer.address());
});

// TODO: make server listen for stream connections, take logs and parse them
// From logs, pull log events and construct spans
// p = parser(stream);
// setInterval(p.pullLogEventsAndAddToSpanConstructor() , 1000)

// Tree constructor: every 1s, take in spans from queue and match into trees
// Every so often, we poll for the tree graph from the tree, given all the log events
