import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Usage:
 *   node tools/buildArtifactOptionsFinal.mjs "원신_성유물 - 나무위키.pdf" "artifactOptions.json" "artifactOptions.final.json"
 */

const PDF_PATH = process.argv[2] ?? "원신_성유물 - 나무위키.pdf";
const INPUT_JSON_PATH = process.argv[3] ?? "artifactOptions.json";
const OUTPUT_JSON_PATH = process.argv[4] ?? "artifactOptions.final.json";

/**
 * 나무위키 PDF에 등장하는 '축성 비경' 이름들(ko) -> (en/ja/nationKey) 매핑
 * - 모르는 건 nationKey: "unknown"으로 둡니다.
 * - 필요하면 계속 추가/수정 가능
 */
const DOMAIN_MAP = {
  // Mondstadt
  "한 여름의 정원": { en: "Midsummer Courtyard", ja: "夏の庭", nationKey: "mondstadt" },
  "각인의 골짜기": { en: "Valley of Remembrance", ja: "忘却の峡谷", nationKey: "mondstadt" },
  "빈다그니르의 정상": { en: "Peak of Vindagnyr", ja: "フィンドニールの頂上", nationKey: "mondstadt" },

  // Liyue
  "화지 산굴": { en: "Clear Pool and Mountain Cavern", ja: "華池岩岫", nationKey: "liyue" },
  "무망 인구 밀궁": { en: "Hidden Palace of Zhou Formula", ja: "無妄引咎密宮", nationKey: "liyue" },
  "하늘을 찌르는 땅": { en: "Domain of Guyun", ja: "孤雲凌霄の処", nationKey: "liyue" },
  "산등성이의 파수꾼": { en: "Ridge Watch", ja: "山脊の見守り", nationKey: "liyue" },
  "암중 협곡": { en: "The Lost Valley", ja: "巨淵の廃跡", nationKey: "liyue" },

  // Inazuma
  "단풍의 정원": { en: "Momiji-Dyed Court", ja: "紅葉ノ庭", nationKey: "inazuma" },
  "깊이 잠든 정원": { en: "Slumbering Court", ja: "熟眠の庭", nationKey: "inazuma" },

  // Sumeru
  "연각의 탑": { en: "Spire of Solitary Enlightenment", ja: "有頂の塔", nationKey: "sumeru" },
  "적금색 폐허": { en: "City of Gold", ja: "金色の都", nationKey: "sumeru" },

  // Fontaine (확실한 것만)
  "빛바랜 극장": { en: "Faded Theater", ja: "色褪せた劇場", nationKey: "fontaine" },
  "죄업의 종말": { en: "Denouement of Sin", ja: "罪禍の終末", nationKey: "fontaine" },
  "황폐한 조선소": { en: "Derelict Masonry Dock", ja: "荒廃した造船所", nationKey: "fontaine" },

  // 아래는 PDF에 등장하지만 지역 확신이 없으면 unknown 유지
  "달 아이의 보관소": { en: "Moonchild's Treasures", ja: "月の子の宝庫", nationKey: "unknown" },
  "무지개령의 정토": { en: "Sanctum of Rainbow Spirits", ja: "虹霊の浄土", nationKey: "unknown" },
  "서리 내린 기계 무덤": { en: "Frostladen Machinery", ja: "霜に覆われた機械の墓", nationKey: "unknown" },
  "쇳물 요새": { en: "Molten Iron Fortress", ja: "溶鉄の要塞", nationKey: "unknown" },
  "폭포 옆의 도시": { en: "Waterfall Wen", ja: "滝辺の町", nationKey: "unknown" },
};

function makeSourceDetail(kind, nameKo, nationKey = "unknown", nameEn = null, nameJa = null) {
  return {
    kind,
    name: {
      ko: nameKo,
      en: nameEn ?? nameKo,
      ja: nameJa ?? nameKo,
    },
    nationKey,
  };
}

function parseObtainLine(obtainText) {
  const tokens = obtainText.split(",").map((x) => x.trim()).filter((x) => x.length > 0);

  const details = [];
  const sources = [];

  for (const token of tokens) {
    if (token.startsWith("축성 비경:")) {
      const domainKo = token.split(":", 2)[1].trim();
      const mapped = DOMAIN_MAP[domainKo] ?? { en: domainKo, ja: domainKo, nationKey: "unknown" };
      details.push(makeSourceDetail("domain", domainKo, mapped.nationKey, mapped.en, mapped.ja));
      sources.push(domainKo);
      continue;
    }

    if (token.includes("성유물 반환의 신비")) {
      details.push(makeSourceDetail("other", "성유물 반환의 신비", "unknown", "Artifact Strongbox", "ストロングボックス"));
      sources.push("성유물 반환의 신비");
      continue;
    }

    if (token.includes("주간 보스")) {
      details.push(makeSourceDetail("boss", "주간 보스", "unknown", "Weekly Boss", "週ボス"));
      sources.push("주간 보스");
      continue;
    }

    if (token.includes("우두머리")) {
      details.push(makeSourceDetail("boss", "우두머리(월드/필드 보스)", "unknown", "Boss (World/Elite)", "ワールド/精鋭ボス"));
      sources.push("우두머리");
      continue;
    }

    // 기타 토큰은 other로 그대로
    details.push(makeSourceDetail("other", token));
    sources.push(token);
  }

  // dedupe
  const dedupDetails = [];
  for (const d of details) {
    const exists = dedupDetails.some((x) => x.kind === d.kind && x.name.ko === d.name.ko);
    if (!exists) {
      dedupDetails.push(d);
    }
  }

  const dedupSources = [];
  for (const s of sources) {
    if (!dedupSources.includes(s)) {
      dedupSources.push(s);
    }
  }

  return { sources: dedupSources, sourceDetails: dedupDetails };
}

function buildPdfEnToObtain(pdfText) {
  // PDF 전체 텍스트에서 "4.x.y." 섹션들만 추출
  const parts = ("\n" + pdfText).split(/\n(?=4\.\d+\.\d+\.)/g);

  const map = new Map();

  for (const part of parts) {
    const lines = part.split("\n").map((x) => x.trim()).filter((x) => x.length > 0);

    const headerIndex = lines.findIndex((x) => /^4\.\d+\.\d+\./.test(x));
    if (headerIndex < 0) {
      continue;
    }

    const koName = lines[headerIndex + 1] ?? "";
    if (!koName) {
      continue;
    }

    // 영어 이름 후보: 헤더 다음 2~8줄 사이에서 알파벳이 포함된 줄
    let enName = "";
    for (let i = headerIndex + 2; i < Math.min(lines.length, headerIndex + 8); i += 1) {
      const s = lines[i];
      const hasAlphabet = /[A-Za-z]/.test(s);
      const isSetEffect = s.startsWith("2세트") || s.startsWith("4세트");
      if (hasAlphabet && !isSetEffect) {
        enName = s;
        break;
      }
    }
    if (!enName) {
      continue;
    }

    // 획득처
    let obtain = "";
    for (let i = headerIndex; i < Math.min(lines.length, headerIndex + 80); i += 1) {
      const s = lines[i];
      if (s.startsWith("획득처")) {
        obtain = s.replace("획득처", "").trim();
        break;
      }
    }

    if (!obtain) {
      continue;
    }

    map.set(enName, obtain);
  }

  return map;
}

async function readPdfText(pdfFilePath) {
  const buffer = fs.readFileSync(pdfFilePath);
  const uint8Array = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDocument = await loadingTask.promise;

  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();

    const strings = content.items
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .filter((x) => x.length > 0);

    pageTexts.push(strings.join("\n"));
  }

  return pageTexts.join("\n");
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_JSON_PATH)) {
    console.error(`Input json not found: ${INPUT_JSON_PATH}`);
    process.exit(1);
  }

  const pdfText = await readPdfText(PDF_PATH);
  const artifactOptions = JSON.parse(fs.readFileSync(INPUT_JSON_PATH, "utf-8"));

  const enToObtain = buildPdfEnToObtain(pdfText);

  let matched = 0;
  let missing = 0;

  for (const setItem of artifactOptions.artifactSets) {
    const enName = setItem?.label?.en;
    if (typeof enName !== "string" || !enName.trim()) {
      continue;
    }

    const obtain = enToObtain.get(enName);
    if (!obtain) {
      missing += 1;
      continue;
    }

    const parsed = parseObtainLine(obtain);

    if (!setItem.meta) {
      setItem.meta = { rarity: [], sources: [], sourceDetails: [] };
    }

    // rarity는 기존 값 유지 (이미 들어가있다면)
    setItem.meta.sources = parsed.sources;
    setItem.meta.sourceDetails = parsed.sourceDetails;

    matched += 1;
  }

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(artifactOptions, null, 2), "utf-8");

  console.log(`OK: wrote ${OUTPUT_JSON_PATH}`);
  console.log(`matched=${matched}, missing=${missing}`);
  console.log("Tip: missing은 PDF 텍스트 파싱 실패이거나, enName이 PDF와 완전 일치하지 않는 경우입니다.");
}

await main();