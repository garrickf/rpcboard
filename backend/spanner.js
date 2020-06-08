/** spanner.js
 *
 * The spanner (could there be a better name?) pairs client/server log events
 * such that they create a full span (client communication to server, and back).
 */

const EventEmitter = require("events").EventEmitter;

const Span = require("./classes/span");
const { EVENT_TYPES } = require("./eventTypes");
const { TRANSPORT_OPS, ROLES } = require("./constants");

class Spanner extends EventEmitter {
  constructor() {
    super();

    this.unprocessedClientEvents = [];
    this.unprocessedServerEvents = [];
    this.parsers = [];
  }

  /** Clients call this to begin parsing. */
  start() {
    this.parsers.forEach((parser) => parser.start());
  }

  onSpanCreation(cb) {
    this.on(EVENT_TYPES.SPAN_CREATION, cb);
  }

  _emitSpanEvent(span) {
    // console.log(this.unprocessedServerEvents);
    // console.log(this.unprocessedClientEvents);
    this.emit(EVENT_TYPES.SPAN_CREATION, span);
  }

  /**
   * Internal helper that tries to match a logEntry, otherwise adding it to the
   * unprocessed queues.
   */
  _handleLogEvent(newEvent) {
    let foundIdx = -1;
    if (newEvent.role === ROLES.SERVER) {
      // Try to match with existing client events
      foundIdx = this.unprocessedClientEvents.findIndex((event) => {
        const clientSendBeforeServerRecv =
          event.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE] <
          newEvent.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
        const serverReplyBeforeClientRecv =
          newEvent.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE] <
          event.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
        const authoritiesMatch = event.authority === newEvent.authority;
        const pathMatch = event.path === newEvent.path;
        return (
          clientSendBeforeServerRecv &&
          serverReplyBeforeClientRecv &&
          authoritiesMatch &&
          pathMatch
        );
      });
    } else {
      // ROLES.CLIENT
      foundIdx = this.unprocessedServerEvents.findIndex((event) => {
        const clientSendBeforeServerRecv =
          newEvent.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE] <
          event.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
        const serverReplyBeforeClientRecv =
          event.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE] <
          newEvent.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
        const authoritiesMatch = event.authority === newEvent.authority;
        const pathMatch = event.path === newEvent.path;
        return (
          clientSendBeforeServerRecv &&
          serverReplyBeforeClientRecv &&
          authoritiesMatch &&
          pathMatch
        );
      });
    }

    if (foundIdx === -1) {
      if (newEvent.role === ROLES.SERVER) {
        this.unprocessedServerEvents.push(newEvent);
      } else {
        this.unprocessedClientEvents.push(newEvent);
      }
    } else {
      // Matching index was found; get other array
      const arr =
        newEvent.role === ROLES.SERVER
          ? this.unprocessedClientEvents
          : this.unprocessedServerEvents;
      // Access that idx
      const matchingEvent = arr[foundIdx];
      arr.splice(foundIdx, 1); // Remove

      // Create a new span
      const span = new Span(newEvent, matchingEvent);
      // Emit span
      this._emitSpanEvent(span);
    }

    // console.log(this.unprocessedServerEvents.length);
    // console.log(this.unprocessedClientEvents.length);
    // console.log("------");
    // I think there's an eager matching bug...depending on how the events come in
    // IDEA: store and roll different executions of events until 0 left over?
  }

  addParser(parser) {
    this.parsers.push(parser);
    parser.onLogEvent((logEvent) => {
      this._handleLogEvent(logEvent);
    });
  }
}

// Usage: const Spanner = require("./spanner");
module.exports = Spanner;
