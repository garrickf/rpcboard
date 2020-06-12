/** treeGeneratorTest.js
 *
 * Test TreeGenerator.
 */

const readline = require("readline");

const Spanner = require("./spanner");
const Parser = require("./parser");
const TreeGenerator = require("./treeGenerator");
const { treeFromJSON } = require("./serialization");

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
});

treeGenerator = new TreeGenerator(spanner);
treeGenerator.onTreeUpdate((tree) => {
  console.log("update!")
  treeGenerator.prettyPrintSelf();
  // console.log(JSON.stringify(treeGenerator.tree)); // Debug serialization
  // // Debug resuscitation
  // const newTree = treeFromJSON(JSON.stringify(treeGenerator.tree))
  // treeGenerator._prettyPrint(newTree, 0);

  const json_dump = treeGenerator.dumpJSON();
  console.log(json_dump);
});
treeGenerator.start();
