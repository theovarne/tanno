const test = require('node:test');
const assert = require('node:assert/strict');
const { lifeEngine, hashId } = require('../lib/life-engine.cjs');

const images = Array.from({ length: 36 }, (_, index) => `sevra-${String(index + 1).padStart(3, '0')}.png`);

test('specimen appearance is part of the deterministic life record', () => {
  for (const id of [1, 777, 12321, 404217746]) {
    const first = lifeEngine(id, images);
    const repeat = lifeEngine(id, images);
    assert.deepEqual(repeat, first);
    assert.equal(first.imageIndex, hashId(id) % images.length);
    assert.equal(first.imageSrc, images[first.imageIndex]);
  }
});

test('life engine supports an unavailable image pool without changing identity traits', () => {
  const withImage = lifeEngine(777, images);
  const withoutImage = lifeEngine(777);
  assert.equal(withoutImage.imageIndex, null);
  assert.equal(withoutImage.imageSrc, null);
  for (const key of ['id', 'name', 'species', 'palette', 'eyes', 'body', 'temperament', 'rarity', 'trait', 'lifespanClass']) {
    assert.equal(withImage[key], withoutImage[key]);
  }
});
