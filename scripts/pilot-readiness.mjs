import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync('pilot/readiness.json','utf8'));
const failures=[];
for (const [key,value] of Object.entries(config.operator)) if (typeof value !== 'string' || !value.trim()) failures.push(`operator.${key}`);
for (const [key,value] of Object.entries(config.deployment)) if (!value) failures.push(`deployment.${key}`);
if (config.deployment.pilotProjectId && config.deployment.pilotProjectId===config.deployment.narrationProjectId) failures.push('pilot project must differ from narration project');
for (const key of ['classroomComputer','teacherWalkthrough','educationalReview','mediaRights']) if (!config.acceptance[key]) failures.push(`acceptance.${key}`);
for (const page of ['privacy','terms','support']) if (/class="placeholder"/.test(readFileSync(`public/${page}.html`,'utf8'))) failures.push(`public/${page}.html has unfilled operator details`);
if (failures.length) { console.error(`Pilot release is not ready:\n${failures.map(item=>`- ${item}`).join('\n')}`); process.exitCode=1; }
else console.log('Pilot deployment prerequisites recorded. Keep test results and real-world evidence with the release.');
