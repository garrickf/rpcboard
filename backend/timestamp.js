class Timestamp extends Date {
  constructor() {
    super();
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
}

// Usage: const Timestamp = require("./timestamp");
module.exports = Timestamp;
