const EventEmitter = require('./EventEmitter');

module.exports = class Stream extends EventEmitter {
  #thunks;
  #batch = 1;
  #actions = [];
  #flowing = false;
  #paused = false;
  #closed = false;

  constructor(id, ...thunks) {
    super();
    this.id = id;
    this.#thunks = thunks.flat();
    this.#flow();
  }

  clear() {
    this.#thunks.length = 0;
    return this;
  }

  length() {
    return this.#thunks.length;
  }

  batch(n) {
    this.#batch = n;
    return this;
  }

  pause() {
    this.#paused = true;
    this.#emit('pause');
    return this;
  }

  resume() {
    this.#paused = false;
    this.#emit('resume');
    return this.#flow();
  }

  close(reason) {
    this.#closed = reason;
    this.#emit('close');
  }

  open() {
    this.#closed = false;
    this.#emit('open');
  }

  abort(...args) {
    this.#actions.forEach(action => action.abort(...args));
    this.#emit('abort');
    return this.clear();
  }

  push(...thunks) {
    if (this.#closed !== false) return this.#reject(thunks.flat());
    this.#thunks.push(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  unshift(...thunks) {
    if (this.#closed !== false) return this.#reject(thunks.flat());
    this.#thunks.unshift(...thunks);
    this.#emit('add');
    return this.#flow();
  }

  #emit(name) {
    this.#actions.forEach(action => this.emit(name, { action }));
  }

  #reject(thunks) {
    thunks.forEach(thunk => thunk().abort(this.#closed));
    return this;
  }

  async #flow() {
    if (!this.#flowing && !this.#paused && this.#thunks.length) {
      this.#flowing = true;
      this.#actions = this.#thunks.splice(0, this.#batch).map(a => a());
      this.#emit('flow');
      await Promise.all(this.#actions);
      this.#flowing = false;
      this.#flow();
    }
    return this;
  }

  static define(id, ...thunks) {
    return (Stream[id] = new Stream(id, thunks.flat()));
  }
};
