import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { ttsGenerationEnabled, ttsLanguage, ttsServiceAccount, ttsSpeakingRate, ttsVersion, ttsVoice } from './config.js';
import {
  FirebaseStorageGateway,
  FirestoreNarrationRepository,
  GoogleTextToSpeechGateway,
  structuredLogger
} from './narration/firebase-adapters.js';
import { NarrationGenerationDisabledError, NarrationService } from './narration/narration-service.js';
import { narrationBindingInputFingerprint } from './narration/binding-input.js';

if (!getApps().length) initializeApp();

export const generateNarrationBinding = onDocumentWritten({
  document: 'narrationBindings/{bindingId}',
  region: 'europe-west1',
  timeoutSeconds: 120,
  memory: '512MiB',
  maxInstances: 10,
  serviceAccount: ttsServiceAccount
}, async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const beforeData = event.data?.before.exists ? event.data.before.data() : undefined;
  const afterData = after.data();
  if (!afterData) return;
  if (beforeData && narrationBindingInputFingerprint(beforeData) === narrationBindingInputFingerprint(afterData)) return;
  const fingerprint = narrationBindingInputFingerprint(afterData);
  // Delivery can be duplicated or out of order. An older result must never
  // replace the output of a newer edit while synthesis is in flight.
  const current = await after.ref.get();
  if (!current.exists || narrationBindingInputFingerprint(current.data()) !== fingerprint) return;
  const updateIfCurrent = (updates: Record<string, unknown>) => getFirestore().runTransaction(async transaction => {
    const latest = await transaction.get(after.ref);
    if (!latest.exists || narrationBindingInputFingerprint(latest.data()) !== fingerprint) return;
    transaction.update(after.ref, updates);
  });

  const sourceText = typeof afterData.sourceText === 'string' ? afterData.sourceText : '';
  const force = afterData.forceGeneration === true;
  const service = new NarrationService(
    new FirestoreNarrationRepository(),
    new GoogleTextToSpeechGateway(),
    new FirebaseStorageGateway(),
    structuredLogger,
    { generationEnabled: ttsGenerationEnabled.value() }
  );
  try {
    const asset = await service.generateOrGet({
      text: sourceText,
      language: typeof afterData.language === 'string' ? afterData.language : ttsLanguage.value(),
      voice: typeof afterData.voice === 'string' ? afterData.voice : ttsVoice.value(),
      speakingRate: typeof afterData.speakingRate === 'number' ? afterData.speakingRate : Number(ttsSpeakingRate.value()),
      audioFormat: afterData.audioFormat === 'mp3' ? 'mp3' : undefined,
      version: typeof afterData.version === 'number' ? afterData.version : ttsVersion.value(),
      revision: typeof afterData.revision === 'string' ? afterData.revision : undefined,
      force,
      requestId: event.id
    });
    await updateIfCurrent({
      assetKey: asset.assetKey,
      audioUrl: asset.audioUrl,
      storagePath: asset.storagePath,
      checksum: asset.checksum,
      cached: asset.cached,
      status: 'ready',
      generatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      forceGeneration: false,
      errorCode: FieldValue.delete()
    });
  } catch (error) {
    if (error instanceof NarrationGenerationDisabledError) {
      await updateIfCurrent({ status: 'pending', updatedAt: FieldValue.serverTimestamp() });
      logger.info('Narration generation disabled', { bindingId: event.params.bindingId });
      return;
    }
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'GENERATION_FAILED';
    await updateIfCurrent({
      status: 'failed',
      errorCode: errorCode.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64),
      lastErrorAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      forceGeneration: false
    });
    throw error;
  }
});
