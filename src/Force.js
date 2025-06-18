const { pipeline } = require('./Util');

/**
 * Continuously force-repeat the stream->action until the stream is aborted
 */
module.exports = class Force {
  constructor(...steps) {
    return async (data, context) => {
      let aborted = false;
      const onAbort = () => (aborted = true);
      context.stream.once('abort', onAbort);
      await pipeline(steps.flat().map(step => value => step(value, context)), data);
      if (!aborted) context.actor.stream(context.stream, context.action);
      context.stream.off('abort', onAbort);
    };
  }
};
