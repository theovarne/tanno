const tamayura = require('../assets/js/engine.js');

const BODY_TYPES = ['round', 'compact', 'long', 'soft-edged', 'wide'];
const TRAITS = ['watchful', 'patient', 'restless', 'quiet', 'curious', 'steadfast', 'shy'];
const ENGINE_VERSION = 1;

function normalizeId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1 || id > tamayura.SUPPLY) {
    throw new RangeError('Life ID must be an integer from 1 to 1,000,000,000.');
  }
  return id;
}

function hashId(id) {
  const text = `TANNO:${id}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function lifeEngine(value, specimenImages = []) {
  const id = normalizeId(value);
  const original = tamayura.generate(id);
  const hash = hashId(id);
  const imageCount = Array.isArray(specimenImages) ? specimenImages.length : 0;
  const imageIndex = imageCount ? hash % imageCount : null;
  return Object.freeze({
    engineVersion: ENGINE_VERSION,
    id,
    displayId: String(id).padStart(9, '0'),
    name: `TANNO #${String(id).padStart(9, '0')}`,
    species: original.species,
    palette: original.palette,
    eyes: original.eyes,
    body: BODY_TYPES[hash % BODY_TYPES.length],
    temperament: original.temperament,
    rarity: original.rarity,
    trait: TRAITS[(hash >>> 8) % TRAITS.length],
    lifespanClass: original.lifespanDays === Infinity ? 'unbounded' : `${original.lifespanDays} days / design class`,
    legendaryId: original.legendaryId,
    imageIndex,
    imageSrc: imageIndex === null ? null : specimenImages[imageIndex],
  });
}

function lifePixels(value) {
  return tamayura.pixels(normalizeId(value));
}

module.exports = { lifeEngine, lifePixels, normalizeId, hashId, ENGINE_VERSION, SUPPLY: tamayura.SUPPLY, PIXELS: tamayura.N };

