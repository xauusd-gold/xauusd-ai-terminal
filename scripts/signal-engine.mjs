function toNumber(value) {
  const n = Number.parseFloat(String(value ?? '').replace(/[^-\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function analyzeEconomicEvent(event) {
  const name = String(event.Event || '').toLowerCase();
  const actual = toNumber(event.Actual);
  const forecast = toNumber(event.Forecast);
  const previous = toNumber(event.Previous);

  // Never create a directional trade signal from forecast-vs-previous alone.
  if (actual === null || forecast === null) {
    return {
      bias: 'neutral',
      confidence: 0,
      surprise: null,
      reason: 'Actual और Forecast उपलब्ध होने तक directional signal नहीं बनाना चाहिए.'
    };
  }

  const surprise = actual - forecast;

  // Higher-than-expected readings are normally bearish for gold for these US macro releases.
  const bearishWhenHigher = /cpi|inflation|pce|payroll|nfp|employment|pmi|ism|gdp|retail sales|consumer confidence|fed funds|interest rate|rate decision|jolts|durable goods/.test(name);
  const bullishWhenHigher = /unemployment|jobless claims|initial claims|continuing claims/.test(name);

  if (!bearishWhenHigher && !bullishWhenHigher) {
    return {
      bias: 'neutral',
      confidence: 0,
      surprise,
      reason: 'इस event के लिए predefined gold-impact mapping नहीं है; manual/context analysis आवश्यक है.'
    };
  }

  const threshold = Math.max(Math.abs(forecast) * 0.005, 0.01);
  if (Math.abs(surprise) < threshold) {
    return {
      bias: 'neutral',
      confidence: 45,
      surprise,
      reason: `Actual ${actual} और Forecast ${forecast} में meaningful surprise नहीं है.`
    };
  }

  const goldBullish = bullishWhenHigher ? surprise > 0 : surprise < 0;
  const magnitude = Math.min(95, Math.round(55 + Math.min(40, Math.abs(surprise) / threshold * 10)));

  return {
    bias: goldBullish ? 'bullish' : 'bearish',
    confidence: magnitude,
    surprise,
    reason: `Actual ${actual} vs Forecast ${forecast}: ${goldBullish ? 'softer US data supports a bullish gold bias' : 'stronger US data supports a bearish gold bias'}.`
  };
}
