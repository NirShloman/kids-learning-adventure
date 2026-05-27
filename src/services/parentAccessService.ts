const PARENT_CODE_STORAGE_KEY = 'kids-learning-adventure.parent-code';
const PARENT_CODE_SALT = 'kids-learning-adventure-parent-gate-v1';

function hashCode(code: string): string {
  const value = `${PARENT_CODE_SALT}:${code}`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

export function normalizeParentCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, 4);
}

export function isValidParentCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

export function hasParentCode(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(PARENT_CODE_STORAGE_KEY));
}

export function setParentCode(code: string): boolean {
  if (typeof window === 'undefined' || !isValidParentCode(code)) return false;
  window.localStorage.setItem(PARENT_CODE_STORAGE_KEY, hashCode(code));
  return true;
}

export function verifyParentCode(code: string): boolean {
  if (typeof window === 'undefined' || !isValidParentCode(code)) return false;
  return window.localStorage.getItem(PARENT_CODE_STORAGE_KEY) === hashCode(code);
}

export function resetParentCode(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PARENT_CODE_STORAGE_KEY);
}
