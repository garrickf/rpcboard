/** spannerTest.js
 *
 * Testing Spanner class.
 */

const readline = require("readline");

const Spanner = require("./spanner");
const Parser = require("./parser");

// Change test files below
// const TEST_FILES = [
//   "../rpc/staticLogs/helloWorld/server-twice.txt",
//   "../rpc/staticLogs/helloWorld/client-twice.txt",
// ];
const TEST_FILES = [
  "../rpc/staticLogs/pingpong/server-recv.txt",
  "../rpc/staticLogs/pingpong/server-pair.txt",
  "../rpc/staticLogs/pingpong/client-2.txt",
];

spanner = new Spanner();

TEST_FILES.forEach((test_file) => {
  const readInterface = readline.createInterface({
    input: fs.createReadStream(test_file),
    output: process.output,
    console: false,
  });

  const parser = new Parser(readInterface);
  spanner.addParser(parser);
})

spanner.onSpanCreation((span) => {
  console.log(span);
  console.log(span.getStart());
  console.log(span.getServerStart());
  console.log(span.getServerEnd());
  console.log(span.getEnd());
  // console.log(JSON.stringify(span)); // Serialization debug
});
spanner.start();
