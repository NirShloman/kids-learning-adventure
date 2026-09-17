import { brand } from '../config/brand';
import symbols from '../content/narration-symbols.json';

/** Keeps display spelling intact while supplying the approved Hebrew pronunciation to TTS. */
export function toNarrationText(text: string): string {
  const label=(symbols as Record<string,string>)[text.trim()];
  if(label)return label;
  for(const prefix of ['קלף ','רמז: התשובה היא ']){
    if(text.startsWith(prefix))return prefix+toNarrationText(text.slice(prefix.length));
  }
  return text.replace(/ידע[׳']לה/gu, brand.pronunciation);
}
