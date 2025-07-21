const Loop = require('../src/Loop');
const Actor = require('../src/Actor');
const Stream = require('../src/Stream');
const Action = require('../src/Action');
const { timeout } = require('../src/Util');

describe('Loop', () => {
  test('Loop Class', async () => {
    let num = 0;

    const action = new Action('loop', [
      (_, { abort }) => {
        timeout(3000).then(() => abort('timeout'));
      },

      new Loop(async () => {
        await timeout(500);
        num++;
      }),
    ]);

    await action();
    expect(num).toBeGreaterThan(4);
    expect(num).toBeLessThan(6);
  });

  test('Abort loop from action', async () => {
    let num = 0;
    const action = new Action('loop', new Loop(() => timeout(100).then(() => num++)));
    const promise = new Actor().perform(action);
    await timeout(500);
    promise.abort();
    await timeout(100);
    const $num = num;
    await timeout(500);
    expect(num).toEqual($num);
  });

  test('Abort loop from stream', async () => {
    let num = 0;
    const stream = new Stream();
    const action = new Action('loop', new Loop(() => timeout(100).then(() => num++)));
    new Actor().stream(stream, action);
    await timeout(500);
    stream.abort();
    await timeout(100);
    const $num = num;
    await timeout(500);
    expect(num).toEqual($num);
  });

  test('Abort manual loop from stream', async () => {
    let num = 0;
    const stream = new Stream();

    Action.define('loop', (_, { actor }) => {
      num++;
      actor.stream(stream, 'loop');
    });

    new Actor().stream(stream, 'loop');
    await timeout(500);
    stream.abort();
    await timeout(100);
    const $num = num;
    await timeout(500);
    expect(num).toEqual($num);
  });

  test('Chained stream, multiple loop actions, abort with reason', async () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const actor = new Actor();
    const stream = new Stream().chained(false);
    const action1 = new Action('loop', new Loop((_, context) => timeout(100).then(() => spy1(context))));
    const action2 = new Action('loop', new Loop((_, context) => timeout(100).then(() => spy2(context))));
    actor.stream(stream, action1);
    actor.stream(stream, action2);
    await timeout(200);
    stream.abort(null);

    expect(spy1.mock.calls.some(([arg]) => {
      return arg?.promise?.reason === null;
    })).toBe(true);

    expect(spy2.mock.calls.some(([arg]) => {
      return arg?.promise?.reason === null;
    })).toBe(true);

    // expect(spy1).toHaveBeenCalledWith(expect.objectContaining({
    //   promise: expect.objectContaining({ reason: null }),
    // }));

    // new Actor().stream(stream, action);
    // await timeout(500);
    // stream.abort();
    // await timeout(100);
    // const $num = num;
    // await timeout(500);
    // expect(num).toEqual($num);
  });
});
