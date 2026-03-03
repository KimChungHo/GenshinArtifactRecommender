import fs from 'fs';
import path from 'path';

const ARTIFACTS_EN_URL = 'https://genshin-db-api.vercel.app/api/v5/artifacts?dumpResult=true&matchCategories=true&query=names&resultLanguage=English&verboseCategories=true';
const ARTIFACTS_KO_URL = 'https://genshin-db-api.vercel.app/api/v5/artifacts?dumpResult=true&matchCategories=true&query=names&resultLanguage=Korean&verboseCategories=true';
const ARTIFACTS_JA_URL = 'https://genshin-db-api.vercel.app/api/v5/artifacts?dumpResult=true&matchCategories=true&query=names&resultLanguage=Japanese&verboseCategories=true';

const ARTIFACT_OPTIONS_PATH = path.resolve('src/data/artifactOptions.json');

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return await response.json();
}

function buildArtifactSets({ filenames, namesKo, namesEn, namesJa }) {
  const artifactSets = [];

  artifactSets.push({
    value: 'none',
    label: {
      ko: '세트 선택',
      en: 'Select set',
      ja: 'セットを選択'
    }
  });

  for (let index = 0; index < filenames.length; index++) {
    const filename = filenames[index];
    artifactSets.push({
      value: filename,
      label: {
        ko: namesKo[index] ?? namesEn[index] ?? filename,
        en: namesEn[index] ?? filename,
        ja: namesJa[index] ?? namesEn[index] ?? filename
      }
    });
  }

  return artifactSets;
}

function extractNamesByFilenameOrder(apiResponse) {
  const filenames = apiResponse?.filename;
  const results = apiResponse?.result;
  if (!Array.isArray(filenames) || !Array.isArray(results)) {
    throw new Error('Unexpected API response shape: missing filename/result arrays');
  }
  const names = results.map((item) => item?.name).filter((name) => typeof name === 'string');

  if (names.length !== filenames.length) {
    // Defensive: if API returns fewer result entries (shouldn't), still align by index.
    // We'll pad with undefined.
    while (names.length < filenames.length) {
      names.push(undefined);
    }
  }

  return { filenames, names };
}

async function main() {
  const [enJson, koJson, jaJson] = await Promise.all([
    fetchJson(ARTIFACTS_EN_URL),
    fetchJson(ARTIFACTS_KO_URL),
    fetchJson(ARTIFACTS_JA_URL)
  ]);

  const { filenames: filenamesEn, names: namesEn } = extractNamesByFilenameOrder(enJson);
  const { filenames: filenamesKo, names: namesKo } = extractNamesByFilenameOrder(koJson);
  const { filenames: filenamesJa, names: namesJa } = extractNamesByFilenameOrder(jaJson);

  // Ensure order compatibility by filename.
  const filenames = filenamesEn;
  if (filenamesKo.join('|') !== filenames.join('|') || filenamesJa.join('|') !== filenames.join('|')) {
    throw new Error('Filename lists differ between languages. API format changed?');
  }

  const artifactSets = buildArtifactSets({ filenames, namesKo, namesEn, namesJa });

  const raw = JSON.parse(fs.readFileSync(ARTIFACT_OPTIONS_PATH, 'utf-8'));
  raw.artifactSets = artifactSets;

  fs.writeFileSync(ARTIFACT_OPTIONS_PATH, JSON.stringify(raw, null, 2), 'utf-8');

  console.log(`Updated artifactSets in: ${ARTIFACT_OPTIONS_PATH}`);
  console.log(`Artifact sets count: ${artifactSets.length - 1} (+1 none option)`);
}

await main();
