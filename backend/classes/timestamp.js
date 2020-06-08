/** timestamp.js
 *
 * Presents a Timestamp class that extends the JS Date class with a nanoseconds
 * field.
 */

class Timestamp extends Date {
  /** Constructor takes NSString, or undefined (if not passed) */
  constructor(JSONTimestamp) {
    super();
    this.setMilliseconds(0);
    this.nanoseconds = 0;
    if (!!JSONTimestamp) {
      this.fromNSString(JSONTimestamp);
    }
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

  /** Given string s, rehydrate the timestamp with its information */
  fromNSString(s) {
    const pattern = /\[([\d]{4}).([\d]+).([\d]+)\]([\d]+):([\d]+)\.([\d]+)\.([\d]+)/;
    const matches = s.match(pattern);
    if (!matches) return;

    const [_, year, month, date, hr, min, sec, nsec] = matches;
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setFullYear
    this.setFullYear(year, month - 1, date);
    this.setHours(hr, min, sec);
    this.setNanoseconds(nsec);
  }

  toJSON() {
    return this.toNSString();
  }

  // Returns a primitive that can be used for comparison
  valueOf() {
    return this.toNSString();
  }
}

// Usage: const Timestamp = require("./classes/timestamp");
module.exports = Timestamp;
