export function parseTimeToSeconds(text){
  if (!text) return NaN;
  if (text === '(DNF)') return NaN;
  const parts = String(text).split(':');
  if (parts.length === 1){
    const v = Number(parts[0]);
    return Number.isFinite(v) ? v : NaN;
  }
  let total = 0;
  for (const p of parts){ total = total*60 + Number(p); }
  return Number.isFinite(total) ? total : NaN;
}

export function formatDeltaSeconds(delta){
  if (!Number.isFinite(delta)) return '';
  // keep one decimal place if < 10s, else integer
  const abs = Math.abs(delta);
  const val = abs < 10 ? abs.toFixed(1) : Math.round(abs);
  return val + 's';
}


