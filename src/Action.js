const { AbortError } = require('./Error');
const { withResolvers, pipeline } = require('./Util');

/**
 * An action is just a special function with defined properties to control the flow.
 * Each action constitues a sequence of steps; each discrete enough to satisfy abort() behavior.
 */
module.exports = class Action {
  constructor(id, ...steps) {
    steps = steps.flat();

    const action = (startValue, context = {}) => {
      // Instead of emitting events like crazy, we allow callback listeners
      const listeners = [];

      // Internal state
      let started = false, aborted = false, reason, paused, currentStep;

      // The action is a promise that is resolved or rejected
      const { promise, resolve, reject } = withResolvers();

      // Method to abort the action
      context.abort = (message, forceful = false) => {
        aborted = true;
        reason = message;
        reject(new AbortError('Action Aborted', { message, forceful }));
      };

      // We decorate (and return) the promise with additional props
      context.promise = Object.defineProperties(promise.catch(async (e) => {
        if (!(e instanceof AbortError)) throw e;
        if (!e.data?.forceful) await currentStep;
        return e;
      }), {
        id: { value: id },
        steps: { value: steps.length },
        abort: { get() { return (...args) => context.abort(...args) && this; } },
        listen: { get() { return listener => listeners.push(listener) && this; } },
        aborted: { get: () => aborted },
        started: { get: () => started },
        reason: { get: () => reason },
        pause: {
          get() {
            return () => {
              paused ??= withResolvers();
              steps.unshift(paused.promise);
              return this;
            };
          },
        },
        resume: {
          get() {
            return () => {
              paused?.resolve();
              return this;
            };
          },
        },
      });

      // Pipeline step by step
      pipeline(steps.map((step, index) => value => new Promise((res, rej) => {
        setImmediate(async () => {
          if (!aborted) {
            if (!started) await Promise.all(listeners.map(l => l(0, context))); // Give a chance to abort before starting
            started = true;
            await Promise.all(listeners.map(l => l(index + 1, context))); // Give a chance to abort along with each step
            if (!aborted) {
              currentStep = step(value, context);
              Promise.race([promise, currentStep]).then(res).catch(rej);
            }
          }
        });
      })), startValue).then(resolve).catch(reject);

      return context.promise;
    };

    // We want this function to be an instanceof Action
    Object.setPrototypeOf(action, Action.prototype);

    return action;
  }

  static define(id, ...steps) {
    return (Action[id] = new Action(id, steps.flat()));
  }
};
