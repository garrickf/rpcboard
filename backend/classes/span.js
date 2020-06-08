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

  /**
   * Checks to see if a user-supplied timestamp falls between serverStart and
   * serverEnd
   */
  hasTimestampInServerRange(timestamp) {
    return timestamp > this.getServerStart() && timestamp < this.getServerEnd();
  }
}

module.exports = Span;
