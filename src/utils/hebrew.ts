import type { LearnerGender } from '../types';

const HEBREW_NAME_PATTERN = /^[\u0590-\u05FF][\u0590-\u05FF '\-]{0,29}$/;

export function normalizeHebrewName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 30);
}

export function isValidHebrewName(value: string): boolean {
  return HEBREW_NAME_PATTERN.test(normalizeHebrewName(value));
}

export function genderedText(gender: LearnerGender | null, boy: string, girl: string): string {
  return gender === 'girl' ? girl : boy;
}

export function containsLatinText(value: string): boolean {
  return /[A-Za-z]/.test(value);
}
