const test = require('node:test');
const assert = require('node:assert/strict');
const { lifeEngine, normalizeId, ENGINE_VERSION } = require('../lib/life-engine.cjs');

const pool = Array.from({ length: 36 }, (_, index) => `sevra-${String(index + 1).padStart(3, '0')}.png`);
const fixtures = [
  [1, 'Pip', 'MYTHIC', 2],
  [777, 'Bebi', 'MYTHIC', 6],
  [12321, 'Tama', 'MYTHIC', 12],
  [404217746, 'Poyo', 'COMMON', 24],
  [1000000000, 'Poyo', 'MYTHIC', 10],
];

test('engine v1 identity and specimen mapping remain stable', () => {
  assert.equal(ENGINE_VERSION, 1);
  for (const [id, species, rarity, imageIndex] of fixtures) {
    const expected = lifeEngine(id, pool);
    assert.equal(expected.engineVersion, 1);
    assert.equal(expected.species, species);
    assert.equal(expected.rarity, rarity);
    assert.equal(expected.imageIndex, imageIndex);
    assert.equal(Object.isFrozen(expected), true);
    for (let repeat = 0; repeat < 100; repeat += 1) {
      assert.deepEqual(lifeEngine(id, pool), expected);
    }
  }
});

test('strict integer domain rejects malformed and out-of-range inputs', () => {
  for (const value of [0, -1, 1.1, NaN, Infinity, 'not an id', 1000000001]) {
    assert.throws(() => normalizeId(value), RangeError);
  }
  assert.equal(normalizeId('1'), 1);
  assert.equal(normalizeId('1000000000'), 1000000000);
});
