import raw from "./artifactOptions.json";

export type Locale = "ko" | "en" | "ja";

interface LabelBundle {
  ko: string;
  en: string;
  ja: string;
}

export type ArtifactSetMeta = {
  rarity: number[];
  sources: string[];
};

export interface ArtifactSetRaw {
  value: string;
  label: LabelBundle;
  meta?: ArtifactSetMeta;
}

export interface StatOptionRaw {
  key: string;
  label: LabelBundle;
}

interface RawData {
  artifactSets: ArtifactSetRaw[];
  mainStats: StatOptionRaw[];
  subStats: StatOptionRaw[];
}

const data: RawData = raw as never;

// utility converters
export function getArtifactSetOptions(locale: Locale = "ko") {
  return data.artifactSets.map((item) => ({
    value: item.value,
    label: item.label[locale],
    meta: item.meta ?? { rarity: [], sources: [] },
  }));
}

export function getArtifactSetMeta(value: string): ArtifactSetMeta {
  const found = data.artifactSets.find((x) => x.value === value);
  return found?.meta ?? { rarity: [], sources: [] };
}

export function getMainStatOptions(locale: Locale = "ko") {
  return data.mainStats.map((item) => ({
    key: item.key,
    label: item.label[locale],
  }));
}

export function getSubStatOptions(locale: Locale = "ko") {
  return data.subStats.map((item) => ({
    key: item.key,
    label: item.label[locale],
  }));
}
