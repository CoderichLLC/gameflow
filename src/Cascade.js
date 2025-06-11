const Action = require('./Action');

/**
 * Continuously repeat the stream->action until the stream is aborted
 */
module.exports = class Cascade {
  constructor(...steps) {
    return async (data, context) => {
      let aborted = false;
      const onAbort = () => (aborted = true);
      context.stream.once('abort', onAbort);
      const action = new Action('cascade', steps.flat());
      await action(data, context);
      if (!aborted) context.actor.stream(context.stream, context.action);
      context.stream.off('abort', onAbort);
    };
  }
};
