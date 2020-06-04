/** Test making an event emitter */

const EventEmitter = require("events").EventEmitter;

// Subclass event emitter
class MyEmitter extends EventEmitter {
  aFunction() {
    setTimeout(() => {
      this.emit("event1");
    }, 1000);
  }
}

const e = new MyEmitter();

e.on("event1", () => {
  console.log("an event occurred");
});

// Can assign more event handlers
e.on("event1", () => {
  console.log("an event occurred");
});

// Can clear event handlers
console.log(EventEmitter.listenerCount(e, "event1"));
// e.removeAllListeners();

e.aFunction();
