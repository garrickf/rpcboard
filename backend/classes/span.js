/** span.js
 *
 * The span is two LogEvents
 */

const { ROLES, TRANSPORT_OPS } = require("../constants");

class Span {
  constructor(event1, event2) {
    // Identify client and server events
    this.clientEvent = event1.role === ROLES.CLIENT ? event1 : event2;
    this.serverEvent = event1.role === ROLES.SERVER ? event1 : event2;
    this.clientNodeId = null;
    this.serverNodeId = null;
  }

  /** Returns a Timestamp */
  getStart() {
    return this.clientEvent.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE];
  }

  getEnd() {
    return this.clientEvent.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
  }

  getServerStart() {
    return this.serverEvent.opTimestamps[TRANSPORT_OPS.RECV_MESSAGE];
  }

  getServerEnd() {
    return this.serverEvent.opTimestamps[TRANSPORT_OPS.SEND_MESSAGE];
  }

  getServerThreadId() {
    return this.serverEvent.threadId;
  }

  getClientThreadId() {
    return this.clientEvent.threadId;
  }

  getAuthority() {
    return this.clientEvent.authority;
  }

  getPath() {
    return this.clientEvent.path;
  }

  getClientNodeId() {
    return this.clientNodeId;
  }

  getServerNodeId() {
    return this.serverNodeId;
  }

  setClientNodeId(id) {
    this.clientNodeId = id;
  }

  setServerNodeId(id) {
    this.serverNodeId = id;
  }

  /**
   * Checks to see if a user-supplied timestamp falls between serverStart and
   * serverEnd
   */
  hasTimestampInServerRange(timestamp) {
    return timestamp > this.getServerStart() && timestamp < this.getServerEnd();
  }

  // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#:~:text=stringify()%20method%20converts%20a,a%20replacer%20array%20is%20specified.
  /** 
   * Method which gets called when JSON serialization happens. Returns an
   * object of only the properties we want serialized.
   */
  toJSON() {
    return {
      clientEvent: this.clientEvent,
      serverEvent: this.serverEvent,
      clientNodeId: this.clientNodeId,
      serverNodeId: this.serverNodeId,
    };
  }

  // addData({clientEvent, serverEvent}) {
  //   this.clientEvent = clientEvent;
  //   this.serverEvent = serverEvent;
  // }
}

module.exports = Span;
