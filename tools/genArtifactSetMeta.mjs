/* eslint-disable no-console */
/**
 * Populate src/data/artifactOptions.json -> artifactSets[].meta
 *
 * Goals:
 * - Higher recall: fewer "no sources" cases.
 * - Better localization: show ko/en/ja names whenever possible.
 *
 * Strategy:
 * 1) Parse Fandom wikitext obtain section (case-insensitive heading match + fallbacks).
 * 2) Extract wiki link targets from obtain section lines.
 * 3) For each link target, try to resolve:
 *    - domains API (english) -> if match, build localized domain detail (ko/en/ja) + nationKey
 *    - else enemies API (english) -> if match, build localized boss detail (ko/en/ja) + nationKey
 *    - else keep as "other" with cleaned text
 * 4) Also normalize strongbox / reliquary / generic bosses in localized form.
 */

import fs from "fs";
import path from "path";

const ARTIFACT_OPTIONS_PATH = path.resolve("src/data/artifactOptions.json");
const FANDOM_API = "https://genshin-impact.fandom.com/api.php";
const GENSHIN_DB_API_BASE = "https://genshin-db-api.vercel.app/api/v5";

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function pickRegionKey(rawRegion) {
  if (typeof rawRegion !== "string" || !rawRegion.trim()) {
    return "unknown";
  }

  const normalized = rawRegion.trim().toLowerCase();

  if (normalized.includes("mondstadt")) {
    return "mondstadt";
  }
  if (normalized.includes("liyue")) {
    return "liyue";
  }
  if (normalized.includes("inazuma")) {
    return "inazuma";
  }
  if (normalized.includes("sumeru")) {
    return "sumeru";
  }
  if (normalized.includes("fontaine")) {
    return "fontaine";
  }
  if (normalized.includes("natlan")) {
    return "natlan";
  }
  if (normalized.includes("snezhnaya")) {
    return "snezhnaya";
  }
  if (normalized.includes("khaenri")) {
    return "khaenriah";
  }

  return "unknown";
}

function cleanWikitextLine(line) {
  let s = String(line);

  s = s.replace(/^=+\s*/g, "").replace(/\s*=+$/g, "");
  s = s.replace(/^[\*\#\:\;]+\s*/g, "");
  s = s.replace(/''+/g, "");
  s = s.replace(/\{\{[^}]+\}\}/g, "");
  s = s.replace(/\[\[([^\]|#]+)\|([^\]]+)\]\]/g, "$2");
  s = s.replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, "$1");
  s = s.replace(/\[|\]/g, "");
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function extractLinkTargets(rawLine) {
  const targets = [];
  const regex = /\[\[([^\]|#]+)(?:[^\]]*)\]\]/g;

  let match = regex.exec(rawLine);
  while (match) {
    const t = match[1].trim();
    if (t && !targets.includes(t)) {
      targets.push(t);
    }
    match = regex.exec(rawLine);
  }

  return targets;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return await response.json();
}

async function fetchFandomWikitext(pageTitle) {
  const url = new URL(FANDOM_API);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const json = await fetchJson(url.toString());
  const wikitext = json?.parse?.wikitext?.["*"] ?? "";
  return typeof wikitext === "string" ? wikitext : "";
}

function extractRarityFromText(text) {
  const result = [];

  const regex = /(\d)\s*[-–]?\s*star/gi;
  let match = regex.exec(text);
  while (match) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && !result.includes(n)) {
      result.push(n);
    }
    match = regex.exec(text);
  }

  const regex2 = /(\d)\s*★/g;
  match = regex2.exec(text);
  while (match) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && !result.includes(n)) {
      result.push(n);
    }
    match = regex2.exec(text);
  }

  result.sort((a, b) => a - b);
  return result;
}

function extractSectionByHeading(wikitext, headingRegex) {
  // Find "== Heading ==" line
  const lines = wikitext.split("\n");
  let startIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (headingRegex.test(line)) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex < 0) {
    return "";
  }

  const sectionLines = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^==[^=]/.test(line)) {
      break;
    }
    sectionLines.push(line);
  }

  return sectionLines.join("\n");
}

function extractObtainSection(wikitext) {
  const candidates = [
    /^==\s*How\s*to\s*Obtain\s*==\s*$/i,
    /^==\s*How\s*To\s*Obtain\s*==\s*$/i,
    /^==\s*Obtained\s*From\s*==\s*$/i,
    /^==\s*Obtain\s*==\s*$/i,
    /^==\s*Obtaining\s*==\s*$/i,
    /^==\s*Drop\s*Locations\s*==\s*$/i,
  ];

  for (const r of candidates) {
    const section = extractSectionByHeading(wikitext, r);
    if (section.trim()) {
      return section;
    }
  }

  return "";
}

function buildStrongboxDetail() {
  return {
    kind: "other",
    name: { ko: "성유물 변환(강림)", en: "Artifact Strongbox", ja: "聖遺物の錬成（ストロングボックス）" },
    nationKey: "unknown",
  };
}

function buildDomainReliquaryDetail() {
  return {
    kind: "other",
    name: { ko: "비경 보상(상자)", en: "Domain Reliquary", ja: "秘境報酬（宝箱）" },
    nationKey: "unknown",
  };
}

function buildGenericBossDetail(kindKey) {
  if (kindKey === "weekly") {
    return { kind: "boss", name: { ko: "주간 보스", en: "Weekly Boss", ja: "週ボス" }, nationKey: "unknown" };
  }
  return { kind: "boss", name: { ko: "일반 보스", en: "Normal Boss", ja: "通常ボス" }, nationKey: "unknown" };
}

function extractObtainSignals(sectionText) {
  const rawLines = sectionText
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const otherDetails = [];
  const linkTargets = [];

  let sawStrongbox = false;
  let sawDomainReliquary = false;
  let sawNormalBoss = false;
  let sawWeeklyBoss = false;

  for (const rawLine of rawLines) {
    const cleaned = cleanWikitextLine(rawLine);
    if (!cleaned) {
      continue;
    }

    const lower = cleaned.toLowerCase();

    if (lower.includes("artifact strongbox") || lower.includes("mystic offering")) {
      sawStrongbox = true;
      continue;
    }

    if (lower.includes("domain reliquary")) {
      sawDomainReliquary = true;
      continue;
    }

    if (lower.includes("weekly boss")) {
      sawWeeklyBoss = true;
      continue;
    }

    if (lower.includes("normal boss") || lower.includes("world boss")) {
      sawNormalBoss = true;
      continue;
    }

    const targets = extractLinkTargets(rawLine);
    for (const t of targets) {
      if (!linkTargets.includes(t)) {
        linkTargets.push(t);
      }
    }

    // Keep a cleaned text as other if it looks informative and not pure noise
    const isNoise = cleaned.toLowerCase() === "how to obtain";
    if (!isNoise && targets.length === 0) {
      otherDetails.push({ kind: "other", name: { ko: cleaned, en: cleaned, ja: cleaned }, nationKey: "unknown" });
    }
  }

  if (sawStrongbox) {
    otherDetails.push(buildStrongboxDetail());
  }
  if (sawDomainReliquary) {
    otherDetails.push(buildDomainReliquaryDetail());
  }
  if (sawNormalBoss) {
    otherDetails.push(buildGenericBossDetail("normal"));
  }
  if (sawWeeklyBoss) {
    otherDetails.push(buildGenericBossDetail("weekly"));
  }

  // de-dupe other by english label
  const otherDeduped = [];
  for (const o of otherDetails) {
    const exists = otherDeduped.some((x) => x.name.en === o.name.en);
    if (!exists) {
      otherDeduped.push(o);
    }
  }

  return { linkTargets, otherDetails: otherDeduped };
}

async function queryDomains(domainName, resultLanguage) {
  const url = new URL(`${GENSHIN_DB_API_BASE}/domains`);
  url.searchParams.set("query", domainName);
  url.searchParams.set("dumpResult", "true");
  url.searchParams.set("resultLanguage", resultLanguage);

  const json = await fetchJson(url.toString());
  return json?.result ?? json?.data ?? json?.match ?? json;
}

async function queryEnemies(enemyName, resultLanguage) {
  const url = new URL(`${GENSHIN_DB_API_BASE}/enemies`);
  url.searchParams.set("query", enemyName);
  url.searchParams.set("dumpResult", "true");
  url.searchParams.set("resultLanguage", resultLanguage);

  const json = await fetchJson(url.toString());
  return json?.result ?? json?.data ?? json?.match ?? json;
}

function extractRegion(result) {
  const candidates = [result?.region, result?.location, result?.nation, result?.area];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c;
    }
  }
  return "";
}

const cache = {
  domain: new Map(),
  boss: new Map(),
  resolveKind: new Map(),
};

async function buildDomainDetail(domainName) {
  if (cache.domain.has(domainName)) {
    return cache.domain.get(domainName);
  }

  const [enRes, koRes, jaRes] = await Promise.all([
    queryDomains(domainName, "english"),
    queryDomains(domainName, "korean"),
    queryDomains(domainName, "jap"),
  ]);

  const regionRaw = extractRegion(enRes) || extractRegion(koRes) || extractRegion(jaRes);
  const nationKey = pickRegionKey(regionRaw);

  const detail = {
    kind: "domain",
    name: {
      en: enRes?.name ?? domainName,
      ko: koRes?.name ?? enRes?.name ?? domainName,
      ja: jaRes?.name ?? enRes?.name ?? domainName,
    },
    nationKey,
  };

  cache.domain.set(domainName, detail);
  return detail;
}

async function buildBossDetail(bossName) {
  if (bossName === "Normal Boss") {
    return buildGenericBossDetail("normal");
  }
  if (bossName === "Weekly Boss") {
    return buildGenericBossDetail("weekly");
  }

  if (cache.boss.has(bossName)) {
    return cache.boss.get(bossName);
  }

  const [enRes, koRes, jaRes] = await Promise.all([
    queryEnemies(bossName, "english"),
    queryEnemies(bossName, "korean"),
    queryEnemies(bossName, "jap"),
  ]);

  const regionRaw = extractRegion(enRes) || extractRegion(koRes) || extractRegion(jaRes);
  const nationKey = pickRegionKey(regionRaw);

  const detail = {
    kind: "boss",
    name: {
      en: enRes?.name ?? bossName,
      ko: koRes?.name ?? enRes?.name ?? bossName,
      ja: jaRes?.name ?? enRes?.name ?? bossName,
    },
    nationKey,
  };

  cache.boss.set(bossName, detail);
  return detail;
}

async function resolveLinkTargetToDetail(linkTarget, delayMs) {
  // Avoid repeating resolve
  if (cache.resolveKind.has(linkTarget)) {
    const cached = cache.resolveKind.get(linkTarget);
    return cached;
  }

  // Try as domain (english) first
  try {
    const enDomain = await queryDomains(linkTarget, "english");
    if (enDomain && typeof enDomain.name === "string" && enDomain.name.trim()) {
      const detail = await buildDomainDetail(linkTarget);
      cache.resolveKind.set(linkTarget, detail);
      await sleep(delayMs);
      return detail;
    }
  } catch {
    // ignore
  }

  // Try as enemy/boss (english)
  try {
    const enEnemy = await queryEnemies(linkTarget, "english");
    if (enEnemy && typeof enEnemy.name === "string" && enEnemy.name.trim()) {
      const detail = await buildBossDetail(linkTarget);
      cache.resolveKind.set(linkTarget, detail);
      await sleep(delayMs);
      return detail;
    }
  } catch {
    // ignore
  }

  // Fallback other (cleaned)
  const cleaned = cleanWikitextLine(linkTarget);
  const other = { kind: "other", name: { ko: cleaned, en: cleaned, ja: cleaned }, nationKey: "unknown" };
  cache.resolveKind.set(linkTarget, other);
  return other;
}

function mergeMeta(targetMeta, incoming) {
  const rarityMerged = Array.isArray(targetMeta?.rarity) ? [...targetMeta.rarity] : [];
  for (const r of incoming.rarity ?? []) {
    if (!rarityMerged.includes(r)) {
      rarityMerged.push(r);
    }
  }
  rarityMerged.sort((a, b) => a - b);

  const sourcesMerged = Array.isArray(targetMeta?.sources) ? [...targetMeta.sources] : [];
  for (const s of incoming.sources ?? []) {
    if (!sourcesMerged.includes(s)) {
      sourcesMerged.push(s);
    }
  }

  const detailsMerged = Array.isArray(targetMeta?.sourceDetails) ? [...targetMeta.sourceDetails] : [];
  for (const d of incoming.sourceDetails ?? []) {
    const exists = detailsMerged.some((x) => x.kind === d.kind && x.name?.en === d.name?.en);
    if (!exists) {
      detailsMerged.push(d);
    }
  }

  return { rarity: rarityMerged, sources: sourcesMerged, sourceDetails: detailsMerged };
}

async function main() {
  const raw = fs.readFileSync(ARTIFACT_OPTIONS_PATH, "utf-8");
  const artifactOptions = JSON.parse(raw);

  const targets = artifactOptions.artifactSets.filter((x) => x?.value && x.value !== "none");
  console.log(`Targets: ${targets.length}`);

  // This script makes many requests. Increase if you hit 429.
  const delayMs = 650;

  for (let i = 0; i < targets.length; i += 1) {
    const item = targets[i];
    const englishName = item?.label?.en;

    if (typeof englishName !== "string" || !englishName.trim()) {
      continue;
    }

    process.stdout.write(`[${i + 1}/${targets.length}] ${item.value} (${englishName}) ... `);

    try {
      const wikitext = await fetchFandomWikitext(englishName);
      const rarity = extractRarityFromText(wikitext);

      const obtainSection = extractObtainSection(wikitext);
      const signals = extractObtainSignals(obtainSection);

      const sourceDetails = [];

      // Resolve linked targets to domain/boss/other
      for (const t of signals.linkTargets) {
        const detail = await resolveLinkTargetToDetail(t, delayMs);
        sourceDetails.push(detail);
        await sleep(delayMs);
      }

      // Add normalized other details (strongbox, generic bosses)
      for (const otherDetail of signals.otherDetails) {
        sourceDetails.push(otherDetail);
      }

      // Final de-dupe by kind+en
      const deduped = [];
      for (const d of sourceDetails) {
        const exists = deduped.some((x) => x.kind === d.kind && x.name?.en === d.name?.en);
        if (!exists) {
          deduped.push(d);
        }
      }

      const incoming = {
        rarity,
        sources: deduped.map((x) => x.name.en),
        sourceDetails: deduped,
      };

      item.meta = mergeMeta(item.meta ?? { rarity: [], sources: [], sourceDetails: [] }, incoming);

      console.log("ok");
    } catch (error) {
      console.log("fail");
      console.log(`  - ${String(error?.message ?? error)}`);
      item.meta = item.meta ?? { rarity: [], sources: [], sourceDetails: [] };
    }

    await sleep(delayMs);
  }

  fs.writeFileSync(ARTIFACT_OPTIONS_PATH, JSON.stringify(artifactOptions, null, 2), "utf-8");
  console.log(`Updated: ${ARTIFACT_OPTIONS_PATH}`);
  console.log("Tip: If you see HTTP 429, increase delayMs in tools/genArtifactSetMeta.mjs.");
}

await main();
