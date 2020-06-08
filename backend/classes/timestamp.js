/** timestamp.js
 *
 * Presents a Timestamp class that extends the JS Date class with a nanoseconds
 * field.
 */

class Timestamp extends Date {
  constructor() {
    super();
    this.setMilliseconds(0);
    this.nanoseconds = 0;
  }

  setNanoseconds(value) {
    this.nanoseconds = value;
  }

  getNanoseconds() {
    return this.nanoseconds;
  }

  toNSString() {
    return (
      `[${this.getFullYear()}.${this.getMonth() + 1}.${this.getDate()}]` +
      `${this.getUTCHours()}:${this.getUTCMinutes()}.${this.getUTCSeconds()}.` +
      `${this.getNanoseconds()}`
    );
  }

  // Returns a primitive that can be used for comparison
  valueOf() {
    return this.toNSString();
  }
}

// Usage: const Timestamp = require("./classes/timestamp");
module.exports = Timestamp;
