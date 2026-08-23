export function getGoldSignal({ event = '', actual, forecast, importance = 1 }) {
  const name = String(event).toLowerCase();
  const a = Number(actual);
  const f = Number(forecast);
  if (!Number.isFinite(a) || !Number.isFinite(f)) {
    return { dir: 'wait', score: Math.max(35, 48 - Number(importance || 1) * 2), reason: 'Actual और Forecast दोनों उपलब्ध होने तक directional signal नहीं बनाना चाहिए.' };
  }
  const surprise = a - f;
  const threshold = Math.max(Math.abs(f) * 0.005, 0.01);
  if (Math.abs(surprise) < threshold) {
    return { dir: 'wait', score: 45, reason: `Actual ${a} vs Forecast ${f}: meaningful economic surprise नहीं है.` };
  }
  const inflationHigherBearish = /cpi|inflation|pce|pmi|ism|retail sales|consumer confidence|fed funds|interest rate|rate decision|jolts|durable goods/.test(name);
  const nfpHigherBearish = /nonfarm payroll|non-farm payroll|nfp|payroll/.test(name);
  const unemploymentHigherBullish = /unemployment rate|unemployment/.test(name);
  const claimsHigherBullish = /initial claims|continuing claims|jobless claims/.test(name);
  let goldBullish;
  if (unemploymentHigherBullish || claimsHigherBullish) goldBullish = surprise > 0;
  else if (inflationHigherBearish || nfpHigherBearish) goldBullish = surprise < 0;
  else return { dir: 'wait', score: 40, reason: `${name} के लिए predefined XAUUSD economic-impact mapping उपलब्ध नहीं है.` };
  const strength = Math.min(40, Math.round(Math.abs(surprise) / threshold * 10));
  const score = Math.min(95, Math.max(55, 55 + strength));
  return { dir: goldBullish ? 'long' : 'short', score, reason: `Actual ${a} vs Forecast ${f}. ${goldBullish ? 'Expected से weaker USD-side data होने के कारण Gold bullish bias.' : 'Expected से stronger USD-side data होने के कारण Gold bearish bias.'}` };
}
