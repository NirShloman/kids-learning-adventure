import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDirectory = path.join(repositoryRoot, 'android');
const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const tasks = process.argv.slice(2);

if (!tasks.length) {
  console.error('Pass at least one Gradle task, for example: bundleRelease');
  process.exit(2);
}

const result = spawnSync(gradleWrapper, tasks, {
  cwd: androidDirectory,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
