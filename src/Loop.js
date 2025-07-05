const { pipeline } = require('./Util');

/**
 * Continuously repeat steps; lifecycle is bound to the parent context
 */
module.exports = class Loop {
  constructor(...steps) {
    return (data, context) => {
      let aborted = false;
      const onAbort = () => (aborted = true);
      context.promise.onAbort(onAbort);
      context.stream?.once('abort', onAbort);

      const loop = async () => {
        await pipeline(steps.flat().map(step => value => !aborted && step(value, context)), data);
        if (!aborted) await loop(data, context);
        context.stream?.off('abort', onAbort);
      };

      return loop();
    };
  }
};
