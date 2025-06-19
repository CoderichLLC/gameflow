const EventEmitter = require('events');

module.exports = class Emitter extends EventEmitter {
  emit(...args) {
    super.emit(...args);
    super.emit('*', ...args);
  }

  offFunction(...fns) {
    fns = fns.flat();
    this.eventNames().forEach(eventName => fns.forEach(fn => this.off(eventName, fn)));
    return this;
  }
};
