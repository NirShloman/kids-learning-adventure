export const NARRATION_BINDING_INPUT_FIELDS = [
  'sourceText',
  'language',
  'voice',
  'speakingRate',
  'audioFormat',
  'version',
  'revision',
  'generationRequest'
] as const;

export function narrationBindingInputFingerprint(value: Record<string, unknown> | undefined): string {
  return JSON.stringify(NARRATION_BINDING_INPUT_FIELDS.map((field) => value?.[field] ?? null));
}
