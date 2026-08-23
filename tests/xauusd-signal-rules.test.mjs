import assert from 'node:assert/strict';
import { getGoldSignal } from '../scripts/xauusd-signal-rules.js';

const cases = [
  [{event:'Nonfarm Payrolls', actual:150000, forecast:200000}, 'long'],
  [{event:'Nonfarm Payrolls', actual:250000, forecast:200000}, 'short'],
  [{event:'Unemployment Rate', actual:4.2, forecast:4.0}, 'long'],
  [{event:'Unemployment Rate', actual:3.8, forecast:4.0}, 'short'],
  [{event:'Initial Jobless Claims', actual:230000, forecast:220000}, 'long'],
  [{event:'Initial Jobless Claims', actual:210000, forecast:220000}, 'short'],
  [{event:'CPI', actual:2.8, forecast:3.0}, 'long'],
  [{event:'CPI', actual:3.2, forecast:3.0}, 'short'],
  [{event:'Unknown Indicator', actual:10, forecast:9}, 'wait'],
  [{event:'CPI', actual:null, forecast:3.0}, 'wait'],
];

for (const [input, expected] of cases) {
  assert.equal(getGoldSignal(input).dir, expected, JSON.stringify(input));
}
console.log(`Passed ${cases.length}/${cases.length} XAUUSD signal tests`);
