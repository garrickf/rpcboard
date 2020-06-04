/** parser.js
 *
 * Utility functions and class for parsing lines of log input. A parser accepts
 * a stream and periodically reads from it, assembling and producing completed
 * LogEntries: discrete reconstructed events that mark points of communication
 * between gRPC nodes.
 */

// Note: native modules--no NPM install required!
fs = require("fs");
const readline = require("readline");
const EventEmitter = require("events").EventEmitter;

// Custom
const Timestamp = require("./timestamp");
const { EVENT_TYPES } = require("./eventTypes");

// Debugging
const TEST_FILE = "../rpc/debugLog.txt";

// Create read interface
const readInterface = readline.createInterface({
  input: fs.createReadStream(TEST_FILE),
  output: process.output,
  console: false,
});

// TODO: check for "patterns," or important data in the logs we want to be able
// to pick up and parse. This saves us some computation.

/** Returns a Timestamp object from the log prefix. */
const parseTimestamp = (prefix) => {
  const pattern = /([\d]{2}):([\d]{2}):([\d]{2})\.([\d]{9})/;
  const matches = prefix.match(pattern);
  if (!matches) return null;

  const [_, hr, min, sec, nsec] = matches;
  const ts = new Timestamp();
  ts.setHours(hr, min, sec);
  ts.setNanoseconds(nsec);
  return ts;
};

/** Extracts the TID from the log entry prefix. */
const parseTID = (prefix) => {
  const pattern = /\s(\d+)\s/;
  const matches = prefix.match(pattern);
  if (!matches) return null;

  const tid = matches[1];
  return tid;
};

/**
 * Extracts the file name and line which prompted the log from the log entry
 * prefix.
 */
const parseSourceLine = (prefix) => {
  const pattern = /([\w]+\.cc:[\d]+)]/;
  const matches = prefix.match(pattern);
  if (!matches) return null;

  const sourceLine = matches[1];
  return sourceLine;
};

/**
 * Parse the path (i.e., RPC function called) from the logline. Assumes the path
 * exists (use hasRPCPath)
 */
const parseRPCPath = (logline) => {
  const pattern = /'([/\.\w]+)'/;
  const matches = logline.match(pattern);
  if (!matches) return null;

  const path = matches[1];
  return path;
};

const hasRPCPath = (logline) => {
  const pattern = /:path:/;
  return logline.match(pattern);
};

const parseRPCAuthority = (logline) => {
  // Note: assumes local development (localhost)
  const pattern = /'(localhost:[\d]*)'/;
  const matches = logline.match(pattern);
  if (!matches) return null;

  const path = matches[1];
  return path;
};

const hasRPCAuthority = (logline) => {
  const pattern = /:authority:/;
  return logline.match(pattern);
};

/** Checks if logline is exact match for parsing initial_metadata */
const isParsingInitialMetadata = (logline) => {
  return logline.includes("parsing initial_metadata");
};

// Idea: boolean functions that can determine if the logline is suggesting:
// connection is opening, path is requested, metadata sent, metadata received, etc.

// May need an orchestrator script that starts and runs all these processes

// Potential transport operations we want to watch for
const TRANSPORT_OPS = {
  SEND_INITIAL_METADATA: "send_initial_metadata",
  RECV_INITIAL_METADATA: "recv_initial_metadata",
  SEND_MESSAGE: "send_message",
  RECV_MESSAGE: "recv_message",
  SEND_TRAILING_METADATA: "send_trailing_metadata",
  RECV_TRAILING_METADATA: "recv_trailing_metadata",
  // Note: not included: CANCEL_STREAM, COLLECT_STATS
};

/** Detects if transport op log */
const isTransportOpLog = (logline) => {
  const streamOpPattern = /perform_stream_op\[s=(0x[\dabcdef]*)\]:\s+/;
  const opTypePattern = /[A-Z]+_(?:[A-Z]*_)?(?:METADATA|MESSAGE)/g;

  const streamOp = logline.match(streamOpPattern);
  if (!streamOp) return [];
  const matches = logline.matchAll(opTypePattern);
  // NOTE: match is an array of [fullMatch, idx, input, [...groups]]
  return [...matches].map((match) => match[0].toLowerCase());
};

const parseTransportId = (logline) => {
  const streamOpPattern = /perform_stream_op\[s=(0x[\dabcdef]*)\]:\s+/;
  const streamOp = logline.match(streamOpPattern);
  if (streamOp) return streamOp[1];
  return null;
};

const ROLES = {
  SERVER: "server",
  CLIENT: "client",
};

/**
 * Class that accrues logging data and declares itself complete when all
 * necessary events are parsed and matched
 */
class LogEvent {
  constructor() {
    // Note: ES6 feature for object key by variable
    this.collectedOps = {
      [TRANSPORT_OPS.SEND_INITIAL_METADATA]: false,
      [TRANSPORT_OPS.RECV_INITIAL_METADATA]: false,
      [TRANSPORT_OPS.SEND_MESSAGE]: false,
      [TRANSPORT_OPS.RECV_MESSAGE]: false,
      [TRANSPORT_OPS.SEND_TRAILING_METADATA]: false,
      [TRANSPORT_OPS.RECV_TRAILING_METADATA]: false,
    };
    this.opTimestamps = {
      [TRANSPORT_OPS.SEND_INITIAL_METADATA]: null,
      [TRANSPORT_OPS.RECV_INITIAL_METADATA]: null,
      [TRANSPORT_OPS.SEND_MESSAGE]: null,
      [TRANSPORT_OPS.RECV_MESSAGE]: null,
      [TRANSPORT_OPS.SEND_TRAILING_METADATA]: null,
      [TRANSPORT_OPS.RECV_TRAILING_METADATA]: null,
    };
    this.role = undefined; // server or client (i.e. rec then send or send then rec)
    this.threads = []; // Could have multiple threads (server reader)
    this.transport = null; // NOTE: have only seen one transport
  }

  isComplete() {
    // NOTE: Object.entries() returns [key, value] pairs
    return Object.entries(this.collectedOps).reduce(
      (acc, [_, v]) => acc && v, // Logical AND of all collectedOps
      true
    );
  }

  collectOp(type, data) {
    // Data is an object with kv pairs
    // TYPE is one of TRANSPORT_OPS
    this.collectedOps[type] = true;
    this.opTimestamps[type] = data.timestamp;
    // TODO: just create new object with spread operator? and store
  }
}

// TODO: mapping from thread id/transport id to inprocess connection

const inflightLogEvents = [];
// Store an unidentified log event here until is can be shuffled off
const outstandingLogEvent = {
  logEvent: null,
  tid: null,
  transportID: null,
};
const completedLogEvents = []; // TODO: might just schedule event for each new LogEvent, and add it to an external queue

// Transport ID -> LogEvent
const TransportToLogEvent = {};

// Thread ID -> LogEvent
const TIDToLogEvent = {};

// TODO: extend Event emitter and emit event on LogEvent completion

/** General log data is placed in a 70 character prefix. */
const splitLine = (line) => {
  return [line.substr(0, 70), line.substr(71)];
};

// readInterface.on("line", (line) => {
//   const [prefix, logline] = splitLine(line);
//   // console.log(prefix);
//   // console.log(logline);

//   if (isParsingInitialMetadata(logline)) {
//     /**
//      * Let's assume parsing indicates that the net message is going to be a
//      * RECV_INITIAL_METADATA from the server's point of view
//      */
//     console.log("parsing init meta, create new logevent...");
//     const event = new LogEvent();
//     outstandingLogEvent.logEvent = event;

//     inflightLogEvents.push(event);
//   }

//   if (hasRPCPath(logline)) {
//     inflightLogEvents[0].path = parseRPCPath(logline);
//   }

//   const timestamp = parseTimestamp(prefix);
//   const tid = parseTID(prefix);
//   const transportID = parseTransportId(logline); // TODO: parse transport ID

//   const ops = isTransportOpLog(logline);
//   ops.forEach((op) => {
//     // Mark op as collected and record timestamp
//     inflightLogEvents[0].opTimestamps[op] = timestamp;
//     inflightLogEvents[0].collectedOps[op] = true;

//     if (!inflightLogEvents[0].transport) {
//       inflightLogEvents[0].transport = transportID;
//     }

//     if (!inflightLogEvents[0].threads.includes(tid)) {
//       inflightLogEvents[0].threads.push(tid);
//     }
//   });

//   // Sanity checking code
//   // const ts = parseDate(prefix);
//   // const tid = parseTID(prefix);
//   // const sourceLine = parseSourceLine(prefix);
//   // console.log(ts.toNSString());
//   // console.log(tid);
//   // console.log(sourceLine);

//   // if (hasRPCPath(logline)) {
//   //   console.log("Has RPC path!");
//   //   console.log(parseRPCPath(logline));
//   // }
// });

// setTimeout(() => {
//   console.log(inflightLogEvents);
// }, 1000);

/**
 * The Parser takes in a readInterface and emits events when a LogEvent is
 * found.
 */
class Parser extends EventEmitter {
  constructor(readInterface) {
    super();
    this.readInterface = readInterface; // Store readInterface
    // TODO: initialize bookkeeping variables
  }

  start() {
    this._keepReading(); // Begin processing stream
  }

  /**
   * Convenience wrapper that adds a user-supplied callback to be called when
   * log entry is created.
   */
  onLogEvent(cb) {
    this.on(EVENT_TYPES.LOG_ENTRY_CREATION, cb);
  }

  _emitLogEvent(logEntry) {
    this.emit(EVENT_TYPES.LOG_ENTRY_CREATION, logEntry);
  }

  /**
   * Processes each line from the readInterface and attempts to fit new
   * information into a working set of partial LogEvents
   */
  _keepReading() {
    this.readInterface.on("line", (line) => {
      const [prefix, logline] = splitLine(line);
      // console.log(prefix);
      // console.log(logline);

      if (isParsingInitialMetadata(logline)) {
        /**
         * Let's assume parsing indicates that the net message is going to be a
         * RECV_INITIAL_METADATA from the server's point of view
         */
        console.log("parsing init meta, create new logevent...");
        const event = new LogEvent();
        outstandingLogEvent.logEvent = event;

        inflightLogEvents.push(event);
      }

      if (hasRPCPath(logline)) {
        inflightLogEvents[0].path = parseRPCPath(logline);
      }

      const timestamp = parseTimestamp(prefix);
      const tid = parseTID(prefix);
      const transportID = parseTransportId(logline); // TODO: parse transport ID

      const ops = isTransportOpLog(logline);
      ops.forEach((op) => {
        // Mark op as collected and record timestamp
        inflightLogEvents[0].opTimestamps[op] = timestamp;
        inflightLogEvents[0].collectedOps[op] = true;

        if (!inflightLogEvents[0].transport) {
          inflightLogEvents[0].transport = transportID;
        }

        if (!inflightLogEvents[0].threads.includes(tid)) {
          inflightLogEvents[0].threads.push(tid);
        }
      });

      if (inflightLogEvents.length && inflightLogEvents[0].isComplete()) {
        this._emitLogEvent(inflightLogEvents[0]);
        inflightLogEvents.pop(0);
      }
    });
  }
}

// Usage: const Parser = require("./parser");
module.exports = Parser;

// Sequence: assume parser logline will always go to the next recv metadata call
// (this may not be true for interleaving)
// then, next line sets transport id and thread id
// for server side messages, track by transport id first, then thread id as a fallback

// for client side, i think thread id could potentially come first

// Read entire file example:
// fs.readFile("../rpc/debugLog.txt", "utf8", (err, data) => {
//   if (err) {
//     return console.log("errr");
//   }
//   console.log(data);
// });
