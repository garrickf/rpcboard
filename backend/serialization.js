/** Utilities for serialization and deserialization (from JSON) */

const Timestamp = require("./classes/timestamp");
const TreeNode = require("./classes/treeNode");
const Span = require("./classes/span");
const LogEvent = require("./classes/logEvent");

/** Creates a live LogEvent (member functions added) from a passed in object */
const logEventFromObj = (logEvent_obj) => {
  Object.keys(logEvent_obj.opTimestamps).forEach((key) => {
    const ts_string = logEvent_obj.opTimestamps[key];
    logEvent_obj.opTimestamps[key] = new Timestamp(ts_string);
  });
  const logEvent = new LogEvent();
  logEvent.addData(logEvent_obj);
  return logEvent;
};

/** Creates a live Span (member functions added) from a passed in object */
const spanFromObj = (span_obj) => {
  // TODO: allow constructor to take undefined, undefined to keep pattern consistent
  const span = new Span(
    logEventFromObj(span_obj.clientEvent),
    logEventFromObj(span_obj.serverEvent)
  );
  span.setClientNodeId(span_obj.clientNodeId);
  span.setServerNodeId(span_obj.serverNodeId);
  return span;
};

/** Recursively turns objects into live TreeNodes */
const turnIntoTree = (data) => {
  const treeNode = new TreeNode();
  treeNode.addData(data);
  treeNode.children = treeNode.children.map((childObj) =>
    turnIntoTree(childObj)
  );
  return treeNode;
};

const treeFromJSON = (JSONTree) => {
  console.log(JSONTree); // Debug

  // NOTE: second parameter is reviver function, takes completed object!
  const data = JSON.parse(JSONTree, (key, value) => {
    if (key === "span") {
      if (!value) return value;
      return spanFromObj(value);
    } else {
      return value;
    }
  });

  return turnIntoTree(data);
};

const hTreeFromObj = (hTree_obj) => {
  // console.log(hTree_obj); // Debug
  // Recursively reconstitute spans
  const reviveSpans = (obj) => {
    obj.children.forEach((child) => {
      reviveSpans(child);
    });
    if (!!obj.span) {
      obj.span = spanFromObj(obj.span);
    }
  };
  reviveSpans(hTree_obj);
  return turnIntoTree(hTree_obj);
};

const timestampsFromNSStringArray = (timestamps) => {
  return timestamps.map((timestampString) => {
    return new Timestamp(timestampString);
  });
};

// Usage: const { treeFromJSON } = require("./serialization");
module.exports = {
  treeFromJSON,
  hTreeFromObj,
  timestampsFromNSStringArray,
};
