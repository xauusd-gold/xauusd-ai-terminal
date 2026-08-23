import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name}() not found in index.html`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}()`);
}

const numFn = extractFunction('num');
const analyzeFn = extractFunction('analyze');
const analyze = new Function(`${numFn}\n${analyzeFn}\nreturn analyze;`)();

const cases = [
  [{Event:'Nonfarm Payrolls', Actual:150000, Forecast:200000}, 'long'],
  [{Event:'Nonfarm Payrolls', Actual:250000, Forecast:200000}, 'short'],
  [{Event:'Unemployment Rate', Actual:4.2, Forecast:4.0}, 'long'],
  [{Event:'Unemployment Rate', Actual:3.8, Forecast:4.0}, 'short'],
  [{Event:'Initial Jobless Claims', Actual:230000, Forecast:220000}, 'long'],
  [{Event:'Initial Jobless Claims', Actual:210000, Forecast:220000}, 'short'],
  [{Event:'CPI', Actual:2.8, Forecast:3.0}, 'long'],
  [{Event:'CPI', Actual:3.2, Forecast:3.0}, 'short'],
  [{Event:'Unknown Indicator', Actual:10, Forecast:9}, 'wait'],
  [{Event:'CPI', Actual:null, Forecast:3.0}, 'wait'],
];

for (const [input, expected] of cases) {
  assert.equal(analyze(input).dir, expected, JSON.stringify(input));
}

console.log(`Passed ${cases.length}/${cases.length} actual index.html signal tests`);
