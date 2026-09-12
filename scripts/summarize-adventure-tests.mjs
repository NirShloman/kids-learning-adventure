import fs from 'node:fs';
import path from 'node:path';

// Keep a small, portable record of actual Playwright results alongside the
// human acceptance report. Raw traces/videos remain in the run artifacts.
const inputs = process.argv.slice(2);
if (!inputs.length) throw new Error('Pass one or more Playwright JSON reports.');
const cases = [];
const measurements = [];
const runs = [];
for (const input of inputs) {
  const report = JSON.parse(fs.readFileSync(input, 'utf8'));
  runs.push({
    name: path.basename(input),
    startedAt: report.stats?.startTime,
    durationMs: report.stats?.duration,
    counts: report.stats,
    globalErrors: (report.errors ?? []).map(error => error.message),
  });
  const visit = (suite) => {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const last = test.results.at(-1);
      const source = `tests/${spec.file.replaceAll('\\', '/')}:${spec.line}`;
      const requirement = spec.title.match(/(?:CUR|LET|NUM|SHP|COL|INT|A11Y|LIFE|OFF|ERR|AUDIO|VIS|PERF|REG|BUILD)-\d+/)?.[0]
        ?? (spec.title.startsWith('v2-') ? 'CUR-01'
          : spec.file.includes('glyphs') ? 'LET-01'
          : spec.file.includes('visual') || spec.file.includes('recordings') ? 'VIS-01'
          : spec.file.includes('experience.local') ? 'CUR-03' : 'REG-01');
      cases.push({
        id: `${test.projectName}/${spec.id}`,
        run: path.basename(input),
        requirement,
        scenario: spec.title,
        source,
        preconditions: 'Built production preview; isolated browser/profile; age 4/manual medium and seed 137 for adventure fixtures unless the linked scenario specifies overrides. See ADVENTURE_TEST_PLAN.md.',
        steps: `Execute the scenario and its imported helpers at ${source}; the source contains the exact ordered interactions and assertions.`,
        expected: `The behavior named by this scenario, with acceptance criteria for ${requirement} in ADVENTURE_TEST_PLAN.md.`,
        environment: `${test.projectName} (browser simulation; host ${report.config.metadata?.hostPlatform ?? 'not recorded'})`,
        actual: last?.status === 'passed' ? 'passed' : last?.status === 'skipped' ? 'blocked' : 'failed',
        durationMs: last?.duration,
        attempts: test.results.length,
        startedAt: last?.startTime,
        errors: (last?.errors ?? []).map(error => error.message),
        annotations: test.annotations ?? [],
      });
      for (const attachment of last?.attachments ?? []) {
        if (attachment.name === 'performance.json') {
          const content = attachment.body ? Buffer.from(attachment.body, 'base64').toString() : fs.readFileSync(attachment.path, 'utf8');
          measurements.push(JSON.parse(content));
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report.suites ?? []) visit(suite);
}
const output = 'docs/qa/adventure-v2';
fs.mkdirSync(output, { recursive: true });
const latest = new Map();
for (const item of cases) {
  const previous = latest.get(item.id);
  latest.set(item.id, { ...item, previousRuns: previous ? [...previous.previousRuns, { run: previous.run, actual: previous.actual, errors: previous.errors }] : [] });
}
const finalCases = [...latest.values()];
fs.writeFileSync(path.join(output, 'cases.json'), JSON.stringify({ generatedAt: new Date().toISOString(), executionCount: cases.length, runs, cases: finalCases, measurements }, null, 2) + '\n');
const counts = Object.fromEntries(['passed', 'failed', 'blocked'].map(status => [status, finalCases.filter(c => c.actual === status).length]));
console.log(JSON.stringify({ cases: finalCases.length, executions: cases.length, ...counts, runsWithGlobalErrors: runs.filter(run => run.globalErrors.length).map(run => run.name), measurements }));
// Preserve skipped cases as blocked with their real reason. The human report
// must distinguish duplicate project cases from unavailable acceptance checks.
// Historical runner errors remain visible even after clean remedial reruns.
if (counts.failed || runs.at(-1).globalErrors.length) process.exitCode = 1;
