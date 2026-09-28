'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const runnerSource = fs.readFileSync(path.join(__dirname, '../public/js/coderunner.js'), 'utf8');

async function runNative(language, code, answers) {
  const requests = [];
  const output = [];
  let inputRequests = 0;
  const browser = { window: {}, fetch: async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ code: 0, execResult: { code: 0, stdout: [{ text: 'result' }], stderr: [] } }) };
  } };
  vm.runInNewContext(runnerSource, browser, { filename: 'coderunner.js' });
  const term = {
    clear() { output.length = 0; },
    print(text) { output.push(text); },
    async askInput() { inputRequests++; return answers.shift(); },
  };
  const result = await browser.window.EchoRun.executeAny(language, code, { term });
  return { result, requests, output: output.join(''), inputRequests };
}

test('C++ cin extraction collects input and sends it to the compiler', async () => {
  for (const statement of ['std::cin >> userId >> balance;', 'cin>>userId>>balance;']) {
    const run = await runNative('cpp', `int main() { ${statement} }`, ['108 2450.75', '']);
    assert.equal(run.inputRequests, 2);
    assert.equal(run.requests.length, 1);
    assert.equal(run.requests[0].body.options.executeParameters.stdin, '108 2450.75');
    assert.match(run.output, /This program reads input/);
    assert.equal(run.result.ok, true);
  }
});

test('C++ getline and C scanf continue collecting input', async () => {
  for (const [language, statement] of [['cpp', 'std::getline(std::cin, name);'], ['c', 'scanf("%d", &age);']]) {
    const run = await runNative(language, `int main() { ${statement} }`, ['Ada Lovelace', '']);
    assert.equal(run.requests[0].body.options.executeParameters.stdin, 'Ada Lovelace');
  }
});

test('programs without input run without an input prompt', async () => {
  const run = await runNative('cpp', 'int main() { std::cout << "Hello"; }', []);
  assert.equal(run.inputRequests, 0);
  assert.equal(run.requests[0].body.options.executeParameters.stdin, '');
});
