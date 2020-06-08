/** logEvent.js
 *
 * Class that accrues logging data and declares itself complete when all
 * necessary events are parsed and matched
 */

const { ROLES, TRANSPORT_OPS } = require("../constants");

class LogEvent {
  constructor(guessedRole) {
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

    this.parsedMetadata = false;

    this.role = guessedRole; // server or client (i.e. rec then send or send then rec)
    this.authority = null;
    // this.threads = []; // Could have multiple threads (server reader)
    this.threadId = null;
    this.transportId = null; // NOTE: have only seen one transport

    this.metadata = {};

    // NOTE: allow for inferences from multiple places
    // role inferences: timestamp or parsing.cc provided code
  }

  isComplete() {
    // NOTE: Object.entries() returns [key, value] pairs
    const allOpsCollected = Object.entries(this.collectedOps).reduce(
      (acc, [_, v]) => acc && v, // Logical AND of all collectedOps
      true
    );
    return (
      allOpsCollected && !!this.path && !!this.authority && this.parsedMetadata
    );
    // return allOpsCollected && !!this.role; // Assume TID and transportId done w/
  }

  collectOp(type, data) {
    // Data is an object with kv pairs
    // TYPE is one of TRANSPORT_OPS
    this.collectedOps[type] = true;
    this.opTimestamps[type] = data.timestamp;
    // TODO: just create new object with spread operator? and store

    // NOTE: assume that RECV_MESSAGE has the correct TID we want to store
    if (type === TRANSPORT_OPS.RECV_MESSAGE) {
      this.metadata.recvMessageTID = data.tid;
      this.threadId = data.tid;
    }

    if (!!data.transportId) {
      this.transportId = data.transportId;
    }
  }

  /** Assigns timestamp to all ops in array ops */
  setTimestampForOps(ops, timestamp) {
    ops.forEach((op) => {
      this.opTimestamps[op] = timestamp;
    });
  }

  _inferRoleFromTimestamps() {
    if (
      this.opTimestamps[TRANSPORT_OPS.RECV_INITIAL_METADATA] <
      this.opTimestamps[TRANSPORT_OPS.SEND_INITIAL_METADATA]
    ) {
      // From the server's point of view, we should recv before send
      return ROLES.SERVER;
    } else {
      // From the client's point of view, we send before we recv
      return ROLES.CLIENT;
    }
  }

  /** Infers role based on information stored inside LogEvent */
  setRole() {
    // Right now, we use timestamps
    const role = this._inferRoleFromTimestamps();
    // TODO: cross-reference against guessed role
    this.role = role;
  }

  getThreadId() {
    return this.threadId;
  }

  getTransportId() {
    return this.transportId;
  }

  /** Returns whether or not a LogEvent can be indexed by its id's */
  isIdentifiable() {
    return !!this.threadId && !!this.transportId;
  }
}

// Usage: const LogEvent = require("./classes/logEvent");
module.exports = LogEvent;
