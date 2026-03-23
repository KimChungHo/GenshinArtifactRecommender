/* eslint-disable no-console */
/**
 * Populate src/data/artifactOptions.json -> artifactSets[].meta
 *
 * - meta.rarity: number[] (e.g. [4,5])
 * - meta.sources: string[] (domain / boss / other strings)
 *
 * Data source: https://genshin-db-api.vercel.app (public wrapper around genshin-db)
 */

import fs from "fs";
import path from "path";

const ARTIFACT_OPTIONS_PATH = path.resolve("src/data/artifactOptions.json");
const API_BASE = "https://genshin-db-api.vercel.app/api/v5/artifacts";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeToStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter((x) => typeof x === "string");
  }

  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  return [];
}

function normalizeToNumberArray(value) {
  if (Array.isArray(value)) {
    return value.filter((x) => typeof x === "number");
  }

  if (typeof value === "number") {
    return [value];
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return [parsed];
    }
  }

  return [];
}

function extractArtifactDetails(result) {
  const rarityRaw =
    result?.rarity ??
    result?.rarities ??
    result?.rarityList ??
    result?.raritylist ??
    result?.stars ??
    result?.star;

  const rarity = normalizeToNumberArray(rarityRaw);

  const sourceCandidates = [
    result?.dropDomain,
    result?.dropdomain,
    result?.domain,
    result?.domains,
    result?.obtainedFrom,
    result?.obtainedfrom,
    result?.obtain,
    result?.source,
    result?.sources,
    result?.dropBy,
    result?.dropby,
  ];

  const sources = [];
  for (const candidate of sourceCandidates) {
    const arr = normalizeToStringArray(candidate);
    for (const s of arr) {
      if (!sources.includes(s)) {
        sources.push(s);
      }
    }
  }

  return { rarity, sources };
}

async function fetchArtifact(valueKey, resultLanguage) {
  const url = new URL(API_BASE);
  url.searchParams.set("query", valueKey);
  url.searchParams.set("dumpResult", "true");
  url.searchParams.set("resultLanguage", resultLanguage);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${valueKey}`);
  }

  const json = await response.json();
  const artifactResult = json?.result ?? json?.data ?? json?.match ?? json;
  return extractArtifactDetails(artifactResult);
}

function mergeMeta(targetMeta, incoming) {
  const rarity = Array.isArray(incoming?.rarity) ? incoming.rarity : [];
  const sources = Array.isArray(incoming?.sources) ? incoming.sources : [];

  const rarityMerged = Array.isArray(targetMeta?.rarity) ? [...targetMeta.rarity] : [];
  for (const r of rarity) {
    if (!rarityMerged.includes(r)) {
      rarityMerged.push(r);
    }
  }
  rarityMerged.sort((a, b) => a - b);

  const sourcesMerged = Array.isArray(targetMeta?.sources) ? [...targetMeta.sources] : [];
  for (const s of sources) {
    if (!sourcesMerged.includes(s)) {
      sourcesMerged.push(s);
    }
  }

  return { rarity: rarityMerged, sources: sourcesMerged };
}

async function main() {
  if (!fs.existsSync(ARTIFACT_OPTIONS_PATH)) {
    throw new Error(`Not found: ${ARTIFACT_OPTIONS_PATH}`);
  }

  const raw = fs.readFileSync(ARTIFACT_OPTIONS_PATH, "utf-8");
  const artifactOptions = JSON.parse(raw);

  if (!Array.isArray(artifactOptions?.artifactSets)) {
    throw new Error("artifactOptions.artifactSets is missing");
  }

  const artifactSets = artifactOptions.artifactSets;

  // Skip "none"
  const targets = artifactSets.filter((x) => x?.value && x.value !== "none");

  console.log(`Targets: ${targets.length}`);

  // Languages: we only need one for rarity/sources, but some fields may appear depending on language.
  // Use English for stability.
  const resultLanguage = "english";

  // Simple rate limiting to avoid getting blocked.
  // If you see 429, increase delay or implement retries.
  const delayMs = 250;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const item = targets[i];
    const key = item.value;

    process.stdout.write(`[${i + 1}/${targets.length}] ${key} ... `);

    try {
      const details = await fetchArtifact(key, resultLanguage);
      item.meta = mergeMeta(item.meta ?? { rarity: [], sources: [] }, details);

      successCount += 1;
      console.log("ok");
    } catch (error) {
      failCount += 1;
      console.log("fail");
      console.log(`  - ${String(error?.message ?? error)}`);
      item.meta = item.meta ?? { rarity: [], sources: [] };
    }

    await sleep(delayMs);
  }

  fs.writeFileSync(ARTIFACT_OPTIONS_PATH, JSON.stringify(artifactOptions, null, 2), "utf-8");

  console.log(`Done. success=${successCount}, fail=${failCount}`);
  console.log(`Updated: ${ARTIFACT_OPTIONS_PATH}`);
}

await main();
