import React from "react";
import { getArtifactSetOptions, type ArtifactSetMeta, type Locale } from "../../data/artifactOptions";

type ChipOption = { key: string; label: string; meta: ArtifactSetMeta };
type OptionKey = string;

type ChipSelectSectionProps = {
  title: string;
  description: string;
  options: ChipOption[];
  selectedKey: OptionKey | null;
  onToggle: (key: OptionKey) => void;
};

function ChipSelectSection(props: ChipSelectSectionProps): React.JSX.Element {
  const { title, description, options, selectedKey, onToggle } = props;

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="text-sm font-semibold text-slate-400">{selectedKey ? "1개 선택됨" : "0개 선택됨"}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected: boolean = selectedKey === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              className={
                isSelected
                  ? "rounded-full border border-blue-500 bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm"
                  : "rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ArtifactInfoPage(): React.JSX.Element {
  const uiText = {
    languageTitle: { ko: "언어", en: "Language", ja: "言語" },
    setSearchPlaceholder: { ko: "세트 이름 검색...", en: "Search set name...", ja: "セット名を検索..." },
    setSectionTitle: { ko: "성유물 세트", en: "Artifact Set", ja: "聖遺物セット" },
    setSectionDescription: {
      ko: "세트는 한 개 선택 가능합니다. 선택을 해제하려면 같은 버튼을 다시 누르세요.",
      en: "You can select only one set. Click again to clear.",
      ja: "セットは1つだけ選択できます。もう一度押すと解除されます。",
    },
    detailsTitle: { ko: "세트 정보", en: "Set Details", ja: "セット情報" },
    rarityTitle: { ko: "등급", en: "Rarity", ja: "レアリティ" },
    sourcesTitle: { ko: "획득처", en: "Sources", ja: "入手先" },
    noData: { ko: "정보가 없습니다.", en: "No data.", ja: "情報がありません。" },
  };

  const [locale, setLocale] = React.useState<Locale>("ko");
  const artifactSetOptions = getArtifactSetOptions(locale);

  const artifactSetChipOptions: ChipOption[] = artifactSetOptions
    .filter((option) => option.value !== "none")
    .map((option) => ({
      key: option.value,
      label: option.label,
      meta: option.meta ?? { rarity: [], sources: [] },
    }));

  const [artifactSetSearchText, setArtifactSetSearchText] = React.useState<string>("");

  const normalizedArtifactSetQuery: string = artifactSetSearchText.trim().toLowerCase();

  const filteredArtifactSetChipOptions: ChipOption[] = !normalizedArtifactSetQuery
    ? artifactSetChipOptions
    : artifactSetChipOptions.filter((option) => option.label.toLowerCase().includes(normalizedArtifactSetQuery));

  const [selectedArtifactSetKey, setSelectedArtifactSetKey] = React.useState<OptionKey | null>(null);

  const handleToggleSetKey = (key: OptionKey) => {
    setSelectedArtifactSetKey((prev) => (prev === key ? null : key));
  };

  const selectedOption: ChipOption | undefined = artifactSetChipOptions.find((x) => x.key === selectedArtifactSetKey);
  const selectedMeta: ArtifactSetMeta | null = selectedOption ? selectedOption.meta : null;

  const rarityText: string =
    selectedMeta && selectedMeta.rarity.length > 0
      ? locale === "ko"
        ? [...selectedMeta.rarity].sort((a, b) => a - b).map((x) => `${x}성`).join(", ")
        : [...selectedMeta.rarity].sort((a, b) => a - b).map((x) => `★${x}`).join(", ")
      : uiText.noData[locale];

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{uiText.languageTitle[locale]}</h2>
          <div className="mt-3">
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          <input
            value={artifactSetSearchText}
            onChange={(event) => setArtifactSetSearchText(event.target.value)}
            placeholder={uiText.setSearchPlaceholder[locale]}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>

        <ChipSelectSection
          title={uiText.setSectionTitle[locale]}
          description={uiText.setSectionDescription[locale]}
          options={filteredArtifactSetChipOptions}
          selectedKey={selectedArtifactSetKey}
          onToggle={handleToggleSetKey}
        />

        {selectedArtifactSetKey ? (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-base font-extrabold text-slate-900">{uiText.detailsTitle[locale]}</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-500">{uiText.rarityTitle[locale]}</div>
                <div className="mt-2 text-base font-semibold text-slate-900">{rarityText}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-500">{uiText.sourcesTitle[locale]}</div>
                <div className="mt-2">
                  {selectedMeta && selectedMeta.sources.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                      {selectedMeta.sources.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500">{uiText.noData[locale]}</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
