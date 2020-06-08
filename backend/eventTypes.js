/** events.js
 *
 * Exports shared values for EventEmitters.
 */

const EVENT_TYPES = {
  LOG_ENTRY_CREATION: "log_entry_creation",
  SPAN_CREATION: "span_creation",
  // Could add error
};

// Usage: const { EVENT_TYPES } = require("./eventTypes");
exports.EVENT_TYPES = EVENT_TYPES;
