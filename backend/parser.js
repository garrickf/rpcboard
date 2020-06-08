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
const Timestamp = require("./classes/timestamp");
const LogEvent = require("./classes/logEvent");
const { EVENT_TYPES } = require("./eventTypes");
const { ROLES, PARSE_ROLE_TO_ROLE, TRANSPORT_OPS } = require("./constants");

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
  const pattern = /(?:'|: )([\/\.\w]+)'/;
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
  const pattern = /(?:'|: )(localhost:[\d]*)'/;
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

/** Used to extract context/role from parsing information logline */
const parseParsingRole = (logline) => {
  const pattern = /HTTP:[\d]+:HDR:([\w]+):/;
  const matches = logline.match(pattern);
  if (!matches) return null;

  const role = PARSE_ROLE_TO_ROLE[matches[1]];
  return role;
};

// NOTE: assume we'll receive information to identify a log event
// before information about another log event comes in (we have to RECV_MESSAGE).
// This means that we can store a single in-progress slot and maintain an
// index of TID's/transport ID's to LogEntries.

/** General log data is placed in a 70 character prefix. */
const splitLine = (line) => {
  return [line.substr(0, 70), line.substr(71)];
};

/**
 * The Parser takes in a readInterface and emits events when a LogEvent is
 * found.
 */
class Parser extends EventEmitter {
  /**
   * The constructor takes in a readInterface (something that emits line events)
   * and sets up any necessary bookkeeping variables.
   */
  constructor(readInterface, config = {verbose: false}) {
    super();
    this.readInterface = readInterface; // Store readInterface
    // TODO: initialize bookkeeping variables
    this.sawParsingInitialMetadata = false;
    this.partialLogEvent = null;
    this.transportIDToLogEvent = {};
    this.threadIDToLogEvent = {};

    this.config = config;
  }

  /** Clients call this to begin parsing. */
  start() {
    this._keepReading(); // Begin processing stream
  }

  /**
   * Convenience wrapper that adds a user-supplied callback to be called when
   * log entry is created. Clients call this.
   */
  onLogEvent(cb) {
    this.on(EVENT_TYPES.LOG_ENTRY_CREATION, cb);
  }

  /**
   * Convenience wrapper that emits a LogEntry creation event. The
   * implementation calls this.
   */
  _emitLogEvent(logEntry) {
    this.emit(EVENT_TYPES.LOG_ENTRY_CREATION, logEntry);
  }

  /**
   * Processes each line from the readInterface and attempts to fit new
   * information into a working set of partial LogEvents
   */
  _keepReading() {
    this.readInterface.on("line", (line) => {
      if (this.config.verbose) {
        console.log(line);
      }
      const [prefix, logline] = splitLine(line);

      const timestamp = parseTimestamp(prefix);
      const tid = parseTID(prefix);
      const transportId = parseTransportId(logline);

      // If, in a previous round, we saw a parseInitialMetadata logline
      if (this.sawParsingInitialMetadata) {
        // The next line will show whether the parsing was for server or client
        const role = parseParsingRole(logline);
        if (role === ROLES.SERVER) {
          if (this.config.verbose) {
            console.log("(parser) parsing init meta, create new logevent...");
          }
          const event = new LogEvent(ROLES.SERVER); // Guess server
          event.parsedMetadata = true;

          if (this.partialLogEvent !== null) {
            throw Error("(parser) Partial LogEvent expected to be null..."); // TODO: make more verbose
          }

          // Let's assume parsing indicates that the net message is going to be a
          // RECV_INITIAL_METADATA from the server's point of view
          this.partialLogEvent = event;
          this.sawParsingInitialMetadata = false; // Reset
        } else {
          // Must be ROLES.CLIENT
          // Pull out the existing event by thread ID and re-mark timestamps
          const currEvent = this.threadIDToLogEvent[tid];
          currEvent.setTimestampForOps(
            [
              TRANSPORT_OPS.RECV_INITIAL_METADATA,
              TRANSPORT_OPS.RECV_MESSAGE,
              TRANSPORT_OPS.RECV_TRAILING_METADATA,
            ],
            timestamp
          );

          currEvent.parsedMetadata = true;
          this.sawParsingInitialMetadata = false; // Reset

          if (currEvent.isComplete()) {
            currEvent.setRole();
            return this._emitLogEvent(currEvent); // Got all information needed
          }
        }
      }

      // If the current logline is parseInitialMetadata, pay attention to the
      // next logline
      if (isParsingInitialMetadata(logline)) {
        this.sawParsingInitialMetadata = true;
      }

      // Server-specific: case by the current expected role?
      // Client can hit here even when event is "done" parsing
      let currEvent = null;
      // console.log(this.partialLogEvent);
      if (this.partialLogEvent !== null) {
        currEvent = this.partialLogEvent; // Server event: collecting information before ID
      } else {
        currEvent = this.transportIDToLogEvent[transportId];
        // NOTE: this is where a new client event could pop up
        if (!currEvent) {
          // console.log("(parser) Tried to access event, but got none...");
          // this.partialLogEvent = new LogEvent();
          // currEvent = this.partialLogEvent;
          // CLIENT: try using thread ID
          currEvent = this.threadIDToLogEvent[tid]; // Client event: collect info after ID
        }
      }
      // console.log(currEvent);
      if (hasRPCPath(logline)) {
        currEvent.path = parseRPCPath(logline);

        // console.log(currEvent);

        // NOTE: fixed client parse path, added (byzantine) logic for handling client
        // event completion, but lack of path.
        // todo: my need authority soon (who we sent it to)

        // Client: could be done with an event here (after all transport ops done)
        if (currEvent && currEvent.isComplete()) {
          // TODO: depends on role being set after the fact
          currEvent.setRole();
          return this._emitLogEvent(currEvent);
        }
      }

      if (hasRPCAuthority(logline)) {
        currEvent.authority = parseRPCAuthority(logline);

        // Client: could be done with an event here (after all transport ops done)
        if (currEvent && currEvent.isComplete()) {
          // TODO: depends on role being set after the fact
          currEvent.setRole();
          return this._emitLogEvent(currEvent);
        }
      }

      const ops = isTransportOpLog(logline);
      ops.forEach((op) => {
        // Need to decide between choosing identified and partial
        let currEvent = null;
        if (this.partialLogEvent !== null) {
          // console.log("getting partial");
          currEvent = this.partialLogEvent;
          // console.log(currEvent);
        } else {
          // console.log("getting from lookup");
          currEvent = this.transportIDToLogEvent[transportId];
          // NOTE: this is where a new client event could pop up
          if (!currEvent) {
            // console.log("need to make a new event");
            // throw Error("(parser) Tried to access event, but got none...");
            this.partialLogEvent = new LogEvent();
            currEvent = this.partialLogEvent;
          }
          // console.log(currEvent);
        }

        // Mark op as collected and record timestamp
        currEvent.collectOp(op, {
          timestamp: timestamp,
          tid: tid,
          transportId: transportId,
        });

        // console.log(currEvent, this.transportIDToLogEvent);

        if (this.partialLogEvent !== null && currEvent.isIdentifiable()) {
          this.threadIDToLogEvent[currEvent.getThreadId()] = currEvent;
          this.transportIDToLogEvent[currEvent.getTransportId()] = currEvent;
          this.partialLogEvent = null; // Reset
        }

        if (currEvent.isComplete()) {
          currEvent.setRole();
          return this._emitLogEvent(currEvent);
        }

        // if (!inflightLogEvents[0].transport) {
        //   inflightLogEvents[0].transport = transportId;
        // }

        // if (!inflightLogEvents[0].threads.includes(tid)) {
        //   inflightLogEvents[0].threads.push(tid);
        // }
      });

      // if (inflightLogEvents.length && inflightLogEvents[0].isComplete()) {
      //   inflightLogEvents[0].setRole();
      //   this._emitLogEvent(inflightLogEvents[0]);
      //   inflightLogEvents.pop(0);
      // }
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
