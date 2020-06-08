/** constants.js
 * 
 * Common constants.
 */

const ROLES = {
  SERVER: "server",
  CLIENT: "client",
};

const PARSE_ROLE_TO_ROLE = {
  CLI: ROLES.CLIENT,
  SVR: ROLES.SERVER,
};

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

// Usage: const { ... } = require("./constants");
exports.ROLES = ROLES;
exports.PARSE_ROLE_TO_ROLE = PARSE_ROLE_TO_ROLE;
exports.TRANSPORT_OPS = TRANSPORT_OPS;
