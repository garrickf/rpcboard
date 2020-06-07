/** parserTest.js
 *
 * Utility to run parsing tests.
 */

fs = require("fs");
const readline = require("readline");

const Parser = require("./parser");

// Change test file below
// const TEST_FILE = "../rpc/staticLogs/helloWorld/server-twice.txt";
const TEST_FILE = "../rpc/staticLogs/pingpong/server-recv.txt";

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
// Hot potato
// Three tier service architecture
// Paxos, Raft, or VR
