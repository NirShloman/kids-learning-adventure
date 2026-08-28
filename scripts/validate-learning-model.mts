import { readFileSync } from 'node:fs';
import { skillGraph, skillIdsForLegacySkill, validateSkillGraph } from '../src/learning/skillGraph';
import type { Age, SkillId } from '../src/types';

const games = ['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting'] as const;
const ages: Age[] = [3, 4, 5, 6];
const errors = validateSkillGraph();
const coverage = new Map<SkillId, Map<Age, number>>();
const known = new Set(skillGraph.map((skill) => skill.id));
for (const skill of skillGraph) coverage.set(skill.id, new Map(ages.map((age) => [age, 0])));

for (const game of games) {
  const envelope = JSON.parse(readFileSync(`src/content/${game}.json`, 'utf8')) as { items: Array<{ id: string; skill: string; skillIds?: SkillId[]; ages: Age[] }> };
  for (const item of envelope.items) {
    const skillIds = item.skillIds?.length ? item.skillIds : skillIdsForLegacySkill(item.skill);
    if (!skillIds.length) errors.push(`${item.id}: content has no canonical skill`);
    for (const skillId of skillIds) {
      if (!known.has(skillId)) errors.push(`${item.id}: unknown skill ${skillId}`);
      for (const age of item.ages) coverage.get(skillId)?.set(age, (coverage.get(skillId)?.get(age) ?? 0) + 1);
    }
  }
}

// The eight existing adventure levels are learning activities and provide
// motor/navigation evidence without changing the documented 3,840-item bank.
const experiences = JSON.parse(readFileSync('src/content/experiences.json', 'utf8')) as Array<{ gameId: 'letters' | 'numbers' | 'shapes' | 'colors'; ages: Age[] }>;
for (const experience of experiences) for (const age of experience.ages) {
  coverage.get('motor.fine')?.set(age, (coverage.get('motor.fine')?.get(age) ?? 0) + 1);
}

for (const skill of skillGraph) for (const age of skill.targetAges) {
  const minimum = skill.minimumContentByAge[age] ?? 1;
  const actual = coverage.get(skill.id)?.get(age) ?? 0;
  if (actual < minimum) errors.push(`${skill.id}: age ${age} has ${actual} content units; requires ${minimum}`);
}

if (errors.length) {
  console.error(`Learning-model validation failed with ${errors.length} issue(s).`);
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log(`Validated ${skillGraph.length} skills, prerequisite DAG, 3,840 mapped content units, and age coverage.`);
}
