import type { Difficulty, LearnerProfile, LearningContentDescriptor, ProfileLearningData, SessionPlan, SessionTask, SkillId } from '../types';
import { consecutiveErrors } from './masteryEngine';
import { getSkillDefinition, skillGraph } from './skillGraph';

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function recommendedDifficulty(profile: LearnerProfile, _confidence: number): Difficulty {
  // The profile selection is the source of truth for both free play and the
  // adaptive route. Adaptation changes subject matter and review cadence only.
  return profile.manualDifficulty;
}

function chooseFocusSkill(profile: LearnerProfile, data: ProfileLearningData): SkillId {
  const blockedSkill = consecutiveErrors(data.events) >= 3 ? data.events[data.events.length - 1]?.skillIds[0] : undefined;
  const eligible = skillGraph.filter((skill) => skill.targetAges.includes(profile.age) && skill.id !== blockedSkill);
  return [...eligible].sort((first, second) => {
    const firstMastery = data.mastery[first.id];
    const secondMastery = data.mastery[second.id];
    const firstDue = firstMastery?.status === 'needs-reinforcement' ? -100 : firstMastery?.confidence ?? 0;
    const secondDue = secondMastery?.status === 'needs-reinforcement' ? -100 : secondMastery?.confidence ?? 0;
    return firstDue - secondDue || first.id.localeCompare(second.id);
  })[0]?.id ?? 'foundation.visual-discrimination';
}

function taskFrom(candidate: LearningContentDescriptor, kind: SessionTask['kind'], index: number, reason: string): SessionTask {
  return {
    id: `task-${index + 1}-${candidate.id}`,
    contentId: candidate.id,
    gameId: candidate.gameId,
    skillIds: candidate.skillIds,
    evidenceForm: candidate.evidenceForm,
    difficulty: candidate.difficulty,
    kind,
    reason,
    estimatedSeconds: candidate.evidenceForm.startsWith('adventure') ? 75 : 50,
    completed: false
  };
}

export function planAdaptiveSession(
  profile: LearnerProfile,
  data: ProfileLearningData,
  content: LearningContentDescriptor[],
  now: Date,
  seed: string
): SessionPlan {
  const focusSkill = chooseFocusSkill(profile, data);
  const focusConfidence = data.mastery[focusSkill]?.confidence ?? 0;
  const targetDifficulty = recommendedDifficulty(profile, focusConfidence);
  const dueSkills = new Set(skillGraph.filter((skill) => {
    const mastery = data.mastery[skill.id];
    return mastery?.dueAt && new Date(mastery.dueAt) <= now;
  }).map((skill) => skill.id));
  const today = now.toISOString().slice(0, 10);
  const recent = new Set(data.events.slice(-20).map((event) => event.contentId));
  const eligible = content.filter((item) => item.ages.includes(profile.age))
    .filter((item) => item.difficulty === targetDifficulty)
    .filter((item) => (data.dailyContentCounts[`${today}:${item.id}`] ?? 0) < 2)
    .sort((first, second) => hash(`${seed}:${first.id}`) - hash(`${seed}:${second.id}`));
  const tasks: SessionTask[] = [];
  const push = (pool: LearningContentDescriptor[], kind: SessionTask['kind'], reason: string) => {
    const candidate = pool.find((item) => {
      const previous = tasks[tasks.length - 1];
      if (tasks.some((task) => task.contentId === item.id)) return false;
      if (previous?.contentId === item.id) return false;
      if (tasks.length >= 2 && tasks.slice(-2).every((task) => task.gameId === item.gameId)) return false;
      return true;
    });
    if (candidate) tasks.push(taskFrom(candidate, kind, tasks.length, reason));
  };
  const focusPool = eligible.filter((item) => item.skillIds.includes(focusSkill));
  const reviewPool = eligible.filter((item) => item.skillIds.some((skill) => dueSkills.has(skill)) && !recent.has(item.id));
  const stretchPool = eligible.filter((item) => item.skillIds.some((skill) => getSkillDefinition(skill).prerequisites.includes(focusSkill)));
  if (consecutiveErrors(data.events) >= 2) push(eligible.filter((item) => item.skillIds.some((skill) => (data.mastery[skill]?.confidence ?? 0) >= 60)), 'confidence', 'הצלחה מוכרת אחרי רצף מאתגר');
  for (let index = tasks.length; index < 3; index += 1) push(focusPool, 'focus', `תרגול ממוקד: ${getSkillDefinition(focusSkill).name}`);
  for (let index = 0; index < 2; index += 1) push(reviewPool.length ? reviewPool : eligible.filter((item) => !recent.has(item.id)), 'review', 'חזרה בזמן המתאים לחיזוק');
  push(stretchPool, 'stretch', 'אתגר קטן לקראת השלב הבא');
  while (tasks.length < 6) {
    const before = tasks.length;
    push(eligible, 'focus', `תרגול ממוקד: ${getSkillDefinition(focusSkill).name}`);
    if (tasks.length === before) break;
  }
  return {
    id: `plan-${hash(`${profile.id}:${seed}:${now.toISOString().slice(0, 10)}`).toString(16)}`,
    profileId: profile.id,
    createdAt: now.toISOString(),
    estimatedMinutes: Math.max(5, Math.min(7, Math.round(tasks.reduce((sum, task) => sum + task.estimatedSeconds, 0) / 60))),
    tasks,
    completedAt: null
  };
}
