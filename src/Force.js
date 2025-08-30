const { pipeline } = require('./Util');

/**
 * Continuously force-repeat the stream->action until the STREAM is aborted
 */
module.exports = class Force {
  constructor(...steps) {
    return async (data, context) => {
      let aborted = false;
      const onAbort = () => (aborted = true);
      context.stream.once('abort', onAbort);
      await pipeline(steps.flat().map(step => value => !aborted && step(value, context)), data);
      if (!aborted) context.actor.stream(context.stream, context.action, data); // Repeat with original data
      context.stream.off('abort', onAbort);
    };
  }
};
