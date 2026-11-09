import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';

const [projectId, email, name] = process.argv.slice(2);
if (!projectId || !email || !name || !process.env.OLAMIA_NARRATION_PROJECT_ID || projectId === process.env.OLAMIA_NARRATION_PROJECT_ID) throw new Error('Usage: provision <pilot-project-id> <garden-email> <garden-name>. Set OLAMIA_NARRATION_PROJECT_ID to enforce separation.');
const credential = applicationDefault();
initializeApp({ credential, projectId });
const token = await credential.getAccessToken();
// Admin SDK account creation bypasses the public-signup restriction.
const config = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(projectId)}/config?updateMask=client.permissions.disabledUserSignup`, {
  method: 'PATCH', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ client: { permissions: { disabledUserSignup: true } } })
});
if (!config.ok) throw new Error('Could not disable public signup. No account was created. Enable Identity Platform and grant the provisioning identity permission to update Auth configuration.');
const auth = getAuth();
const existing = await auth.getUserByEmail(email).catch(error => { if (error.code === 'auth/user-not-found') return null; throw error; });
if (existing) throw new Error('Account already exists; use the recovery procedure rather than overwriting its membership.');
const kindergartenId = randomUUID();
const user = await auth.createUser({ email, emailVerified: false, password: `${randomUUID()}!${randomUUID()}`, displayName: name });
try {
  const batch = getFirestore().batch();
  batch.create(getFirestore().doc(`kindergartens/${kindergartenId}`), { name, createdAt: new Date().toISOString() });
  batch.create(getFirestore().doc(`memberships/${user.uid}`), { kindergartenId, disabled: false });
  await batch.commit();
} catch (error) { await auth.deleteUser(user.uid); throw error; }
const link = await auth.generatePasswordResetLink(email);
// The reset URL is sensitive; display only to the administrator, never commit it.
process.stdout.write(`Kindergarten ID: ${kindergartenId}\nPassword setup link (deliver securely): ${link}\n`);
