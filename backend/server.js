/** Server code (adapted from MDN web docs) */
// Load HTTP module
const http = require("http");
const HOSTNAME = "127.0.0.1";
const PORT = 8080;

// Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {
  // Set the response HTTP header with HTTP status and Content type
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World\n");
});

// Listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// TODO: make server listen for stream connections, take logs and parse them
// From logs, pull log events and construct spans
// p = parser(stream);
// setInterval(p.pullLogEventsAndAddToSpanConstructor() , 1000)

// Tree constructor: every 1s, take in spans from queue and match into trees
// Every so often, we poll for the tree graph from the tree, given all the log events