/** parserTest.js
 *
 * Utility to run parsing tests.
 */

fs = require("fs");
const readline = require("readline");

const Parser = require("./parser");

const TEST_FILE = "../rpc/debugLog.txt"; // TODO: turn into examples/staticLogs/...

// Create read interface
const readInterface = readline.createInterface({
  input: fs.createReadStream(TEST_FILE),
  output: process.output,
  console: false,
});

const parser = new Parser(readInterface);
parser.onLogEvent((logEntry) => {
  console.log(logEntry);
});
parser.start();

// TODO: create sample logs for toy programs:
// Hello world
// Hello worlds
// Ping pong
// Hot potato
// Three tier service architecture
// Paxos, Raft, or VR
