const ZONE = 'America/New_York';

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONE,
  year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: true, timeZoneName: 'short',
});

function parseTannoTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatTannoTime(value) {
  const date = parseTannoTime(value);
  if (!date) return 'TIME NOT OBSERVED';
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.month.toUpperCase()} ${parts.day} ${parts.year} · ${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod} ${parts.timeZoneName}`;
}

function relativeTannoTime(value, now = Date.now()) {
  const date = parseTannoTime(value);
  if (!date) return 'NOT OBSERVED';
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds} SEC AGO`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} MIN AGO`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} HR AGO`;
  return `${Math.floor(seconds / 86400)} DAY${seconds < 172800 ? '' : 'S'} AGO`;
}

module.exports = { ZONE, formatTannoTime, relativeTannoTime, parseTannoTime };
