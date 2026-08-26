import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const legalDir = join(root, 'docs', 'legal');
const mediaExtensions = new Set([
  '.gif', '.jpeg', '.jpg', '.m4a', '.mov', '.mp3', '.mp4', '.ogg', '.otf',
  '.png', '.riv', '.svg', '.ttf', '.wav', '.webm', '.webp', '.woff', '.woff2'
]);

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function treeSha256(paths) {
  const digest = createHash('sha256');
  for (const path of [...paths].sort()) {
    digest.update(relative(root, path).replaceAll('\\', '/'));
    digest.update('\0');
    digest.update(sha256(path));
    digest.update('\n');
  }
  return digest.digest('hex');
}

function csv(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

const experience = JSON.parse(readFileSync(join(root, 'src', 'content', 'experience-assets.json'), 'utf8'));
const experienceSources = new Map();
for (const item of Object.values(experience.entries)) {
  experienceSources.set(item.png.replace(/^\//, 'public/'), item.source);
  experienceSources.set(item.webp.replace(/^\//, 'public/'), item.source);
}

function classify(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  const base = {
    creator_provider: 'Unknown; repository custody is not proof of authorship',
    creation_tool: 'Unknown',
    creation_or_receipt_date: 'Unknown',
    input_source: 'No supporting source record found',
    claimed_rights_holder: 'Project owner (claim not verified)',
    license_agreement: 'None found in repository',
    commercial_store_distribution: 'UNVERIFIED',
    attribution_required: 'UNVERIFIED',
    evidence_document: 'No',
    status: 'UNVERIFIED',
    notes_risk: 'Obtain authorship, license, and chain-of-title evidence before release.'
  };

  if (normalized.includes('node_modules/@fontsource/rubik/files/')) {
    return {
      ...base,
      creator_provider: 'The Rubik Project Authors',
      creation_tool: 'Rubik font project / @fontsource package',
      creation_or_receipt_date: 'Package installed; exact font creation date not established here',
      input_source: '@fontsource/rubik 5.3.0',
      claimed_rights_holder: 'Rubik Project Authors',
      license_agreement: 'SIL Open Font License 1.1; license file present',
      commercial_store_distribution: 'YES, subject to OFL 1.1',
      attribution_required: 'License and copyright notice must accompany distribution',
      evidence_document: 'node_modules/@fontsource/rubik/LICENSE; THIRD_PARTY_NOTICES',
      status: 'APPROVED_LICENSE_VERIFIED',
      notes_risk: 'Do not sell the font by itself; preserve OFL notice and Reserved Font Name rules.'
    };
  }

  if (normalized.startsWith('public/assets/audio/music/')) {
    return {
      ...base,
      creator_provider: 'Unknown; described only as user-supplied',
      creation_tool: 'Unknown',
      creation_or_receipt_date: 'Claimed receipt 2026-07-29',
      input_source: 'No composition master, project file, receipt, generation record, or agreement found',
      notes_risk: 'BLOCKER: user-supplied and no named-artist request are not proof. Clear both composition and sound-recording rights.',
      status: 'BLOCKED_UNVERIFIED'
    };
  }

  if (normalized.startsWith('public/assets/video/')) {
    return {
      ...base,
      creator_provider: 'Claimed Google Gemini Veo output; account/user unknown',
      creation_tool: 'Gemini Veo (claim only; product/tier/version not recorded)',
      creation_or_receipt_date: 'Claimed receipt 2026-07-29',
      input_source: 'Claimed Nir/Shir references; prompts and generation IDs absent',
      notes_risk: 'BLOCKER: retain prompts, generation IDs, account/tier, applicable terms, source rights, and human edits. Poster inherits the video risk.',
      status: 'BLOCKED_UNVERIFIED'
    };
  }

  if (normalized.startsWith('public/assets/experience/characters/') ||
      normalized.startsWith('docs/art-direction/references/') ||
      normalized.startsWith('docs/art-direction/masters/')) {
    return {
      ...base,
      creator_provider: 'Claimed OpenAI ImageGen output; operator/account unknown',
      creation_tool: 'OpenAI ImageGen (claim only; model/version not recorded)',
      creation_or_receipt_date: 'Claimed 2026-07-29',
      input_source: 'Nir/Shir art direction; prompts, generation IDs, and source-rights evidence absent',
      notes_risk: 'BLOCKER: AI terms do not prove exclusivity, copyrightability, or non-infringement. Obtain real-person/guardian declaration and release if applicable.',
      status: 'BLOCKED_UNVERIFIED'
    };
  }

  if (normalized.startsWith('docs/art-direction/claude-design/props-source/')) {
    return {
      ...base,
      creator_provider: 'Claimed Anthropic Claude Design output; operator/account unknown',
      creation_tool: 'Claude Design (claim only; plan/model/version not recorded)',
      creation_or_receipt_date: 'Claimed 2026-07-29',
      input_source: 'README references missing uploads/pasted-1785302721105-0.png',
      notes_risk: 'BLOCKER: the referenced source sheet is absent; prompts, output receipt, plan, applicable terms, and source-rights evidence are absent.',
      status: 'BLOCKED_UNVERIFIED'
    };
  }

  if (normalized.startsWith('public/assets/experience/generated/')) {
    const source = experienceSources.get(normalized) ?? 'not-recorded';
    const claude = source === 'claude-design' || source === 'claude-derived';
    return {
      ...base,
      creator_provider: claude ? 'Claimed Anthropic Claude Design / derived project asset' : 'Claimed deterministic project generation',
      creation_tool: claude ? `Claude Design chain (${source})` : 'Project generation scripts (source field: generated)',
      creation_or_receipt_date: 'Manifest generated 2026-07-29',
      input_source: claude ? 'Missing Claude source/receipt evidence' : 'Project scripts/specifications; author assignment not independently verified',
      notes_risk: claude
        ? 'BLOCKER: derivative inherits the missing Claude/source chain-of-title evidence.'
        : 'Verify authorship/assignment for scripts and specifications and retain reproducible source inputs before release.',
      status: claude ? 'BLOCKED_UNVERIFIED' : 'UNVERIFIED'
    };
  }

  if (normalized.startsWith('docs/art-direction/claude-design/')) {
    return {
      ...base,
      creator_provider: 'Claimed project-authored specification created in Claude Design',
      creation_tool: 'Claude Design (claim only)',
      creation_or_receipt_date: 'Claimed 2026-07-29',
      input_source: 'Prompts, output receipt, and applicable terms absent',
      notes_risk: 'UNVERIFIED: specifications alone do not establish ownership of the referenced render outputs.',
      status: 'UNVERIFIED'
    };
  }

  return base;
}

const roots = [
  join(root, 'public', 'assets'),
  join(root, 'public', 'icons'),
  join(root, 'docs', 'art-direction'),
  join(root, 'docs', 'asset-sources')
];
const rubikFiles = walk(join(root, 'node_modules', '@fontsource', 'rubik', 'files'))
  .filter((path) => /rubik-hebrew-(400|500|600|700|800|900)-normal\.(woff2?|ttf)$/i.test(path));
const files = [...new Set([...roots.flatMap(walk), ...rubikFiles])]
  .filter((path) => mediaExtensions.has(extname(path).toLowerCase()))
  .sort();

const headers = [
  'path', 'asset_type', 'creator_or_provider', 'creation_tool', 'creation_or_receipt_date',
  'input_source', 'claimed_rights_holder', 'license_or_agreement', 'commercial_and_store_distribution',
  'attribution_required', 'evidence_document', 'sha256', 'status', 'notes_and_risk'
];
const blockedRecords = [];
const rows = files.map((path) => {
  const relativePath = relative(root, path).replaceAll('\\', '/');
  const metadata = classify(relativePath);
  if (metadata.status === 'BLOCKED_UNVERIFIED') {
    blockedRecords.push({ path: relativePath, hash: sha256(path), risk: metadata.notes_risk });
  }
  return [
    relativePath,
    extname(path).slice(1).toLowerCase(),
    metadata.creator_provider,
    metadata.creation_tool,
    metadata.creation_or_receipt_date,
    metadata.input_source,
    metadata.claimed_rights_holder,
    metadata.license_agreement,
    metadata.commercial_store_distribution,
    metadata.attribution_required,
    metadata.evidence_document,
    sha256(path),
    metadata.status,
    metadata.notes_risk
  ].map(csv).join(',');
});

const groupDefinitions = [
  {
    path: 'GROUP:application-source-code',
    assetType: 'group-tree',
    files: walk(join(root, 'src')).filter((path) => /\.(css|ts|tsx)$/i.test(path)),
    input: 'Repository source under src/ (excluding separately inventoried media)',
    notes: 'Git history shows custody, not authorship or assignment. Obtain contributor/contractor IP assignments and retain development records.'
  },
  {
    path: 'GROUP:educational-content-and-ui-text',
    assetType: 'group-tree',
    files: walk(join(root, 'src', 'content')).filter((path) => /\.(json|ts|tsx)$/i.test(path)),
    input: 'Versioned learning banks and application text in src/content',
    notes: 'Verify original authorship, educational review authority, and absence of copied question-bank or publisher text.'
  },
  {
    path: 'GROUP:legal-and-project-documentation',
    assetType: 'group-tree',
    files: [
      ...walk(join(root, 'docs')).filter((path) => /\.(json|md|txt)$/i.test(path) && !path.endsWith('BLOCKED_ASSETS.md')),
      ...walk(join(root, 'public')).filter((path) => /\.(html|js|json|webmanifest)$/i.test(path))
    ],
    input: 'Project documentation and public legal/static text; generated rights CSV excluded to avoid self-reference',
    notes: 'Draft legal text requires owner review and professional legal advice; replace every placeholder before release.'
  },
  {
    path: 'GROUP:generation-and-build-scripts',
    assetType: 'group-tree',
    files: walk(join(root, 'scripts')).filter((path) => /\.(cjs|js|mjs|ts)$/i.test(path)),
    input: 'Repository scripts used to generate, validate, and package the project',
    notes: 'Verify authorship/assignment and preserve tool/source licenses for any copied script portions.'
  }
];

for (const group of groupDefinitions) {
  rows.push([
    group.path,
    group.assetType,
    'Project contributors; identities and assignments not verified',
    'Repository authoring and build tools',
    'Multiple dates in repository history',
    group.input,
    'Project owner (claim not verified)',
    'No contributor or contractor assignment located',
    'UNVERIFIED',
    'UNVERIFIED',
    'Git history only; not chain-of-title proof',
    treeSha256(group.files),
    'UNVERIFIED',
    `${group.notes} Group contains ${group.files.length} files.`
  ].map(csv).join(','));
}
writeFileSync(join(legalDir, 'ASSET_RIGHTS_REGISTER.csv'), `${headers.map(csv).join(',')}\n${rows.join('\n')}\n`, 'utf8');
writeFileSync(
  join(legalDir, 'BLOCKED_ASSETS.md'),
  `# Assets blocked from release\n\nGenerated 2026-08-22 from the rights register. These ${blockedRecords.length} files must not ship publicly until the missing evidence is accepted by the owner/counsel and recorded in the register, or the files are replaced after owner approval.\n\n${blockedRecords.map((record) => `- \`${record.path}\` — SHA-256 \`${record.hash}\` — ${record.risk}`).join('\n')}\n`,
  'utf8'
);

const packages = [
  ['react', 'React'],
  ['react-dom', 'React DOM'],
  ['scheduler', 'Scheduler'],
  ['matter-js', 'Matter.js'],
  ['motion', 'Motion'],
  ['framer-motion', 'Framer Motion'],
  ['motion-dom', 'Motion DOM'],
  ['motion-utils', 'Motion Utils'],
  ['@capacitor/core', 'Capacitor Core'],
  ['@capacitor/android', 'Capacitor Android'],
  ['@capacitor/ios', 'Capacitor iOS'],
  ['@capacitor/app', 'Capacitor App'],
  ['@capacitor/splash-screen', 'Capacitor Splash Screen'],
  ['tslib', 'tslib'],
  ['loose-envify', 'loose-envify'],
  ['js-tokens', 'js-tokens']
];

function packageNotice([packageName, displayName]) {
  const directory = join(root, 'node_modules', ...packageName.split('/'));
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const licenseName = readdirSync(directory).find((name) => /^licen[cs]e(?:\.|$)/i.test(name));
  const license = licenseName ? readFileSync(join(directory, licenseName), 'utf8').trim() : 'License text missing from installed package.';
  return `-------------------------------------------------------------------------------\n${displayName} (${packageName}) ${manifest.version}\nDeclared license: ${manifest.license}\n\n${license}`;
}

const riveLicense = `MIT License\n\nCopyright (c) 2021 Rive\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`;
const riveWasmLicense = riveLicense.replace('2021 Rive', '2020-2021 Rive');
const rubikLicense = readFileSync(join(root, 'node_modules', '@fontsource', 'rubik', 'LICENSE'), 'utf8').trim();
const notices = `THIRD-PARTY SOFTWARE AND FONT NOTICES\nGenerated from package-lock.json and installed license files on 2026-08-22.\nThis file covers direct and bundled runtime components identified by the audit.\nDevelopment-only tools are documented separately in docs/legal/DEPENDENCY_LICENSE_AUDIT.md.\n\n${packages.map(packageNotice).join('\n\n')}\n\n-------------------------------------------------------------------------------\nRive React runtime (@rive-app/react-webgl2) 4.29.5\nDeclared license: MIT\n\n${riveLicense}\n\n-------------------------------------------------------------------------------\nRive WebGL2 runtime (@rive-app/webgl2) 2.38.5\nDeclared license: MIT\n\n${riveWasmLicense}\n\n-------------------------------------------------------------------------------\nRubik via @fontsource/rubik 5.3.0\nDeclared license: SIL Open Font License 1.1\n\n${rubikLicense}\n`;
writeFileSync(join(root, 'THIRD_PARTY_NOTICES'), notices, 'utf8');
writeFileSync(join(root, 'public', 'THIRD_PARTY_NOTICES.txt'), notices, 'utf8');

console.log(`Wrote ${rows.length} asset records and runtime notices.`);
