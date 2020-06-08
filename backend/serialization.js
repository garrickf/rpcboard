const Timestamp = require("./classes/timestamp");
const TreeNode = require("./classes/treeNode");
const Span = require("./classes/span");
const LogEvent = require("./classes/logEvent");
const { TRANSPORT_OPS } = require("./constants");

// TODO: pretty messy, and wrong nouns used. Clean this up!

const logEventFromJSON = (JSONLogEvent) => {
  // const data = JSON.parse(JSONLogEvent, (key, value) => {
  //   if (TRANSPORT_OPS.hasOwnProperty(key)) {
  //     return new Timestamp(value);
  //   } else {
  //     return value;
  //   }
  // });
  Object.keys(JSONLogEvent.opTimestamps).forEach((key) => {
    const ts_string = JSONLogEvent.opTimestamps[key];
    JSONLogEvent.opTimestamps[key] = new Timestamp(ts_string);
  });
  const logEvent = new LogEvent();
  logEvent.addData(JSONLogEvent);
  return logEvent;
};

/** Passed in an object (for reviving) */
const spanFromJSON = (JSONSpan) => {
  //   const data = JSON.parse(JSONSpan, (key, value) => {
  //   if (key === "clientEvent" || key === "serverEvent") {
  //     console.log(value);
  //     return logEventFromJSON(value);
  //   } else {
  //     return value;
  //   }
  // });

  // const span = new Span(data.clientEvent, data.serverEvent);
  // TODO: allow constructor to take undefined, undefined to keep pattern consistent
  const span = new Span(
    logEventFromJSON(JSONSpan.clientEvent),
    logEventFromJSON(JSONSpan.serverEvent)
  );
  // span.addData(data);
  return span;
};

const turnIntoTree = (data) => {
  const treeNode = new TreeNode();
  treeNode.addData(data);
  treeNode.children = treeNode.children.map((childObj) =>
    turnIntoTree(childObj)
  );
  return treeNode;
};

const treeFromJSON = (JSONTree) => {
  // NOTE: second parameter is reviver function, takes completed object!
  const data = JSON.parse(JSONTree, (key, value) => {
    if (key === "span") {
      if (!value) return value;
      return spanFromJSON(value);
    } else {
      return value;
    }
  });

  return turnIntoTree(data);
};

// Usage: const { treeFromJSON } = require("./serialization");
module.exports = {
  treeFromJSON,
};
