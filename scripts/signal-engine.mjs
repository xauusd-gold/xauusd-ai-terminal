// XAUUSD event-specific surprise engine; integrated by the application build step.
function toNumber(value) {
  const n = Number.parseFloat(String(value ?? '').replace(/[^-\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function analyzeEconomicEvent(event) {
  const name = String(event.Event || '').toLowerCase();
  const actual = toNumber(event.Actual);
  const forecast = toNumber(event.Forecast);
  if (actual === null || forecast === null) return { bias: 'neutral', confidence: 0, surprise: null };
  const surprise = actual - forecast;
  const bearishWhenHigher = /cpi|inflation|pce|payroll|nfp|employment|pmi|ism|gdp|retail sales|consumer confidence|fed funds|interest rate|rate decision|jolts|durable goods/.test(name);
  const bullishWhenHigher = /unemployment|jobless claims|initial claims|continuing claims/.test(name);
  if (!bearishWhenHigher && !bullishWhenHigher) return { bias: 'neutral', confidence: 0, surprise };
  const threshold = Math.max(Math.abs(forecast) * 0.005, 0.01);
  if (Math.abs(surprise) < threshold) return { bias: 'neutral', confidence: 45, surprise };
  const goldBullish = bullishWhenHigher ? surprise > 0 : surprise < 0;
  return { bias: goldBullish ? 'bullish' : 'bearish', confidence: Math.min(95, Math.round(55 + Math.min(40, Math.abs(surprise) / threshold * 10))), surprise };
}
