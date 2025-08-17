const EventEmitter = require('./EventEmitter');
const { AbortError } = require('./Error');
const Action = require('./Action');
const Stream = require('./Stream');

module.exports = class Actor extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
  }

  perform(action, data, context = {}) {
    action = action instanceof Action ? action : Action[action];
    context.actor = this;
    context.action = action;
    const promise = action(data, context);
    this.emit(`pre:${promise.id}`, { data, ...context });
    promise.onStart(() => this.emit(`start:${promise.id}`, { data, ...context }));
    promise.then((result) => {
      const type = result instanceof AbortError ? 'abort' : 'post';
      this.emit(`${type}:${promise.id}`, { data, result, ...context });
    });
    return promise;
  }

  push(...args) {
    return this.#stream(...args);
  }

  unshift(stream, action, data, context = {}, op = 'unshift') {
    return this.#stream(stream, action, data, context, op);
  }

  follow(followPromise, data) {
    let promise;

    const abort = reason => promise.abort(reason);

    // Follow the source steps
    const sourceSteps = Array.from(new Array(followPromise.steps)).map((_, index) => {
      return new Promise((resolve) => {
        followPromise.then(() => { if (followPromise.aborted) abort('$source'); }).catch(abort);
        followPromise.listen((step) => { if (step === index + 1) resolve(); });
      });
    });

    // Delay execution until the source step is finished
    return this.perform(followPromise.id, data, { followPromise }).listen(step => sourceSteps[step - 1]);
  }

  // Backwards compat - to be removed
  stream(...args) {
    return this.#stream(...args);
  }

  #stream(stream, action, data, context = {}, op = 'push') {
    stream = stream instanceof Stream ? stream : Stream[stream];
    context.stream = stream;

    return new Promise((resolve, reject) => {
      stream[op](() => {
        const promise = this.perform(action, data, context);
        promise.then(resolve).catch(reject);
        return promise; // We must return promise because that has all the methods (ie. abort())
      });
    });
  }

  static define(id) {
    return (Actor[id] = new Actor(id));
  }
};
