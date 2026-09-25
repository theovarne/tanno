const test = require('node:test');
const assert = require('node:assert/strict');
const { lifeEngine, lifePixels, normalizeId } = require('../lib/life-engine.cjs');

test('the same ID always produces the same life and portrait', () => {
  const expected = lifeEngine(777);
  const pixels = lifePixels(777);
  for (let i = 0; i < 100; i += 1) {
    assert.deepEqual(lifeEngine(777), expected);
    assert.deepEqual(lifePixels(777), pixels);
  }
  assert.equal(expected.name, 'TANNO #000000777');
  assert.equal(expected.species, 'Bebi');
  assert.equal(expected.palette, 'void');
  assert.equal(expected.eyes, 'closed');
  assert.equal(expected.temperament, 'gloomy');
  assert.equal(expected.rarity, 'MYTHIC');
});

test('different numbers generate independent records', () => {
  assert.notDeepEqual(lifeEngine(1), lifeEngine(2));
  assert.notDeepEqual(lifePixels(1), lifePixels(2));
});

test('IDs are bounded to the census', () => {
  for (const value of [0, -1, 1.5, 'abc', Number.POSITIVE_INFINITY, 1000000001]) {
    assert.throws(() => normalizeId(value), RangeError);
  }
  assert.equal(normalizeId('1000000000'), 1000000000);
});
