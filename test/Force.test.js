const Force = require('../src/Force');
const Actor = require('../src/Actor');
const Stream = require('../src/Stream');
const Action = require('../src/Action');
const { timeout } = require('../src/Util');

describe('Force', () => {
  test('data pipeline', async () => {
    const info = { num: 0 };
    const stream = new Stream(null);

    const action = new Action('loop', new Force([
      () => timeout(100),
      data => data.num++,
    ]));

    await new Actor().stream(stream, action, info);
    await timeout(500);
    stream.abort();
    expect(info.num).toBeGreaterThan(2);
  });
});
