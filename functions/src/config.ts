import { defineBoolean, defineInt, defineString } from 'firebase-functions/params';

export const ttsLanguage = defineString('TTS_LANGUAGE', { default: 'he-IL' });
export const ttsVoice = defineString('TTS_VOICE', { default: 'he-IL-Chirp3-HD-Aoede' });
export const ttsSpeakingRate = defineString('TTS_SPEAKING_RATE', { default: '0.92' });
export const ttsVersion = defineInt('TTS_VERSION', { default: 1 });
export const ttsGenerationEnabled = defineBoolean('TTS_GENERATION_ENABLED', { default: false });
export const ttsServiceAccount = defineString('TTS_SERVICE_ACCOUNT');
