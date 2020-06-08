/** parserTest.js
 *
 * Utility to run parsing tests.
 */

fs = require("fs");
const readline = require("readline");

const Parser = require("./parser");

// Change test file below
// const TEST_FILE = "../rpc/staticLogs/helloWorld/server-twice.txt";
// const TEST_FILE = "../rpc/staticLogs/helloWorld/client-twice.txt";
// const TEST_FILE = "../rpc/staticLogs/pingpong/server-pair.txt";
const TEST_FILE = "../rpc/staticLogs/pingpong/server-recv.txt"; // server reply (to pair), client finish (to pair), server reply (to original client)
// const TEST_FILE = "../rpc/staticLogs/pingpong/client-2.txt"; // input was 2, two hops


// Create read interface
const readInterface = readline.createInterface({
  input: fs.createReadStream(TEST_FILE),
  output: process.output,
  console: false,
});

const parser = new Parser(readInterface, {verbose: true});
parser.onLogEvent((logEntry) => {
  console.log(logEntry);
  // console.log(JSON.stringify(logEntry)); // Debug serialization
});
parser.start();

// TODO: create sample logs for toy programs:
// Hot potato
// Three tier service architecture
// Paxos, Raft, or VR

// TODO: make test cases
