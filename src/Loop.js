const { pipeline } = require('./Util');

/**
 * Continuously repeat steps; lifecycle is bound to the PROMISE
 */
module.exports = class Loop {
  constructor(...steps) {
    return (data, context) => {
      let aborted = false;
      const onAbort = () => (aborted = true);
      context.promise.onAbort(onAbort);

      const loop = async () => {
        await pipeline(steps.flat().map(step => value => !aborted && step(value, context)), data);
        if (!aborted) await loop(data, context);
      };

      return loop();
    };
  }
};
