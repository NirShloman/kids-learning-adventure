import { z } from 'zod';
import { skillGraph } from '../learning/skillGraph';
export const safeId = z.string().min(1).max(180).regex(/^[a-zA-Z0-9:_-]+$/);
const date = z.string().datetime();
const game = z.enum(['letters', 'numbers', 'shapes', 'colors', 'matching', 'memory', 'patterns', 'sorting']);
const age = z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);
const difficulty = z.enum(['easy', 'medium', 'hard']);
const accessibility = z.object(Object.fromEntries(['noTimeLimit', 'reducedMotion', 'reducedParticles', 'reducedBackgroundAudio', 'fewerItems', 'largeTouchTargets', 'highContrast', 'slowNarration', 'extendedResponseTime', 'disableMovingObstacles', 'strongGuidance', 'strongSnap'].map(k => [k, z.boolean().optional()]))).strict();
export const profileSchema = z.object({
  id: safeId, name: z.string().max(30), age, gender: z.enum(['boy', 'girl']).nullable(), avatarId: z.enum(['nir-kippah', 'nir-plain', 'shir']),
  learningMode: z.enum(['automatic', 'manual']), manualDifficulty: difficulty,
  narrationEnabled: z.boolean(), soundEffectsEnabled: z.boolean(), musicEnabled: z.boolean(),
  narrationVolume: z.number().int().min(0).max(100), soundEffectsVolume: z.number().int().min(0).max(100), musicVolume: z.number().int().min(0).max(100),
  accessibility, createdAt: date, updatedAt: date,
}).strict();
const event = z.object({ id: safeId, profileId: safeId, sessionId: safeId, contentId: z.string().min(1).max(200),
  skillIds: z.array(z.string().refine(id => skillGraph.some(s => s.id === id))).min(1).max(17), gameId: game,
  evidenceForm: z.enum(['visual-choice','listening-choice','matching','memory','sequence','sorting','adventure-drag','adventure-navigation','shared-turn','shared-cooperation']),
  correct: z.boolean(), attemptNumber: z.number().int().min(1).max(100000), hintUsed: z.boolean(), responseMs: z.number().nonnegative().nullable(), monotonicMs: z.number().nonnegative().nullable(), occurredAt: date, effectiveDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).strict();
const session = z.object({ id: safeId, profileId: safeId, gameId: game.optional(), mode: z.enum(['adaptive','manual','shared-turns','shared-cooperation']), startedAt: date, completedAt: date, durationSeconds: z.number().nonnegative(), correct: z.number().nonnegative(), total: z.number().nonnegative() }).strict();
// Checkpoints contain the existing game-specific structures. Bound JSON depth/size,
// reject dangerous object keys, and whitelist every writable aggregate root.
function safeJson(value: unknown, depth = 0): boolean {
  if (depth > 16) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 4000;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 5000 && value.every(v => safeJson(v, depth + 1));
  return !!value && typeof value === 'object' && Object.entries(value).every(([k,v]) => !['__proto__','constructor','prototype'].includes(k) && k.length <= 200 && safeJson(v, depth + 1));
}
const json = z.unknown().refine(v => safeJson(v), 'Invalid JSON');
const discovery = z.object({ id: safeId, scope: z.union([game,z.literal('mixed')]), completedAt: date, independent: z.number().int().nonnegative(), assisted: z.number().int().nonnegative(), demonstrated: z.number().int().nonnegative() }).strict();
const adventureProgress = z.object({ version: z.literal(1), completed: z.array(z.string().max(200)).max(5000), rewards: z.array(z.string().max(200)).max(5000), recent: z.array(z.string().max(200)).max(100), creations: z.array(z.object({id:safeId,missionId:z.string().max(200),seed:z.number(),completedAt:date}).strict()).max(1000).optional() }).strict();
const adventureCheckpoint = z.object({ sessionId:safeId,missionIds:z.array(z.string().max(200)).min(1).max(50),missionIndex:z.number().int().min(0).max(50),stepIndex:z.number().int().min(0).max(1000),attempt:z.number().int().positive(),hint:z.boolean(),seed:z.number(),age,difficulty,challenge:difficulty.optional(),fewerItems:z.boolean().optional(),evidenceKeys:z.array(z.string().max(300)).max(5000) }).strict();
const detectiveCheckpoint = z.object({id:safeId,contentVersion:z.string().max(200),age,difficulty,startedAt:date,steps:z.array(z.object({gameId:game,ids:z.array(z.string().max(200)).max(100)}).strict()).max(100),index:z.number().int().nonnegative(),outcomes:z.record(z.string().max(200),z.enum(['independent','assisted','demonstrated'])),attempts:z.record(z.string().max(200),z.number().int().nonnegative()),hinted:z.array(z.string().max(200)).max(1000),wrongOptions:z.record(z.string().max(200),z.array(z.string().max(200)).max(100))}).strict();
const adaptiveCheckpoint = z.object({id:safeId,profileId:safeId,createdAt:date,estimatedMinutes:z.number().nonnegative(),completedAt:date.nullable(),tasks:z.array(z.object({id:safeId,contentId:z.string().max(200),gameId:game,skillIds:z.array(z.string().max(200)).max(17),evidenceForm:event.shape.evidenceForm,difficulty,kind:z.enum(['focus','review','stretch','confidence']),reason:z.string().max(1000),estimatedSeconds:z.number().nonnegative(),completed:z.boolean()}).strict()).max(100)}).strict();
const mastery = z.object({ skillId: z.string().refine(id=>skillGraph.some(s=>s.id===id)),status:z.enum(['new','exposed','practicing','almost-mastered','mastered','needs-reinforcement']),confidence:z.number().min(0).max(100),evidenceCount:z.number().int().nonnegative(),correctCount:z.number().int().nonnegative(),recentOutcomes:z.array(z.boolean()).max(8),evidenceForms:z.array(event.shape.evidenceForm).max(10),intervalStep:z.number().int().min(0).max(5),dueAt:date.nullable(),lastPracticedAt:date.nullable(),lastContentId:z.string().max(200).nullable()}).strict();
const operationBase = z.object({ id: safeId, kindergartenId: safeId, profileId: safeId, sessionId: safeId, createdAt: date,
  baseline: z.object({mastery:z.record(z.string().refine(id=>skillGraph.some(s=>s.id===id)),mastery),dailyContentCounts:z.record(z.string().max(250),z.number().int().nonnegative())}).strict().optional(), historical:z.boolean().optional(),
  kind: z.enum(['create', 'update', 'delete']), profile: profileSchema.partial().optional(), events: z.array(event).max(100).optional(), sessions: z.array(session).max(100).optional(),
  progress: z.object({ journey: z.object({ unlockedWorlds: z.array(game).max(8).optional(), completedLevelIds: z.array(z.string().max(200)).max(5000).optional(), decorationIds: z.array(z.string().max(200)).max(5000).optional() }).strict().optional(),
    recentContent: z.record(z.string().max(200), z.array(z.string().max(200)).max(20)).optional(),
    lastEffectiveNow: date.optional(), adventures: z.partialRecord(z.enum(['letters','numbers','shapes','colors']),adventureProgress).optional(), detectives: z.object({ discoveries:z.array(discovery).max(200),rounds:z.object({}).strict(),last:discovery.optional() }).strict().optional(),
  }).strict().optional(),
  checkpoints: z.array(z.object({ id: safeId, profileId: safeId, sessionId: safeId, scope: z.string().regex(/^(adaptive|detective:(letters|numbers|shapes|colors|matching|memory|patterns|sorting|mixed)|adventure:(letters|numbers|shapes|colors))$/), value: json, updatedAt: date }).strict()).max(20).optional(),
}).strict().superRefine((op, ctx) => {
  if (JSON.stringify(op).length > 700000) ctx.addIssue({ code: 'custom', message: 'Operation too large' });
  if (op.profile?.id && op.profile.id !== op.profileId) ctx.addIssue({ code: 'custom', message: 'Profile mismatch' });
  for (const row of [...(op.events ?? []), ...(op.sessions ?? []), ...(op.checkpoints ?? [])]) if (row.profileId !== op.profileId) ctx.addIssue({ code: 'custom', message: 'Profile mismatch' });
  for (const cp of op.checkpoints ?? []) if (cp.sessionId !== op.sessionId || cp.id !== `${op.sessionId}:${cp.scope}`) ctx.addIssue({ code: 'custom', message: 'Checkpoint mismatch' });
  for (const cp of op.checkpoints ?? []) if (cp.value !== null) {
    const schema = cp.scope === 'adaptive' ? adaptiveCheckpoint : cp.scope.startsWith('detective:') ? detectiveCheckpoint : adventureCheckpoint;
    if (!schema.safeParse(cp.value).success) ctx.addIssue({code:'custom',message:'Invalid checkpoint'});
    if (cp.scope === 'adaptive' && (cp.value as {profileId?:string}).profileId !== op.profileId) ctx.addIssue({code:'custom',message:'Checkpoint owner mismatch'});
  }
  if (op.kind === 'create' && !profileSchema.safeParse(op.profile).success) ctx.addIssue({ code: 'custom', message: 'Incomplete profile' });
  if (op.kind === 'update' && (op.profile?.id || op.profile?.createdAt)) ctx.addIssue({ code: 'custom', message: 'Immutable profile fields' });
  if (op.baseline && op.kind !== 'create') ctx.addIssue({code:'custom',message:'Baseline only on create'});
  if (new Set(op.events?.map(e=>e.id)).size !== (op.events?.length ?? 0)) ctx.addIssue({code:'custom',message:'Duplicate event IDs'});
});
export const operationSchema = z.unknown().superRefine((value,ctx)=>{
  try { if (!safeJson(JSON.parse(JSON.stringify(value)))) ctx.addIssue({code:'custom',message:'Unsafe payload'}); }
  catch { ctx.addIssue({code:'custom',message:'Invalid payload'}); }
}).pipe(operationBase);
