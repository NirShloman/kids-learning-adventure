import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { ContentVersion } from '../types';
import { getFirestoreClient, requireFirestoreClient } from './firebase/firebaseClient';

const CONTENT_VERSIONS_COLLECTION = 'contentVersions';

export async function getPublishedContentVersions(): Promise<ContentVersion[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  const snapshot = await getDocs(query(
    collection(db, CONTENT_VERSIONS_COLLECTION),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  ));

  return snapshot.docs.map((versionDoc) => versionDoc.data() as ContentVersion);
}

export async function saveContentVersion(version: ContentVersion): Promise<void> {
  const db = requireFirestoreClient();
  await setDoc(doc(db, CONTENT_VERSIONS_COLLECTION, version.versionId), version, { merge: true });
}

export function createTrialContentVersion(approvedQuestionCount: number): ContentVersion {
  return {
    versionId: 'content-v1-trial-2026-06',
    name: 'Trial question bank - June 2026',
    createdAt: new Date().toISOString(),
    approvedQuestionCount,
    ageRanges: ['3-4', '4-5', '5-6'],
    worlds: ['letters', 'numbers', 'shapes', 'colors'],
    changelog: [
      'Initial managed Firebase question-bank structure.',
      '120 reviewed seed questions for trial release.',
      'Rule-based content review and duplicate detection.'
    ],
    status: 'published'
  };
}

export const contentVersionService = {
  getPublishedContentVersions,
  saveContentVersion,
  createTrialContentVersion
};
