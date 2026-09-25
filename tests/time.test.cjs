const test = require('node:test');
const assert = require('node:assert/strict');
const { ZONE, formatTannoTime, relativeTannoTime } = require('../lib/time.cjs');

test('absolute archive time uses New York and switches EST / EDT automatically', () => {
  assert.equal(ZONE, 'America/New_York');
  assert.equal(formatTannoTime('2026-01-15T12:00:00Z'), 'JAN 15 2026 · 07:00:00 AM EST');
  assert.equal(formatTannoTime('2026-07-15T12:00:00Z'), 'JUL 15 2026 · 08:00:00 AM EDT');
  assert.equal(formatTannoTime('invalid'), 'TIME NOT OBSERVED');
  assert.equal(formatTannoTime(null), 'TIME NOT OBSERVED');
});

test('relative labels never substitute browser-local absolute time', () => {
  assert.equal(relativeTannoTime('2026-09-24T12:00:00Z', Date.parse('2026-09-24T12:00:04Z')), '4 SEC AGO');
  assert.equal(relativeTannoTime('2026-09-24T12:00:00Z', Date.parse('2026-09-24T12:02:00Z')), '2 MIN AGO');
  assert.equal(relativeTannoTime('invalid'), 'NOT OBSERVED');
});
