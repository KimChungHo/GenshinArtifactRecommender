import React, { type JSX } from "react";
import {
  getArtifactSetOptions,
  getMainStatOptions,
  getSubStatOptions,
  type Locale,
} from "../../data/artifactOptions";
import charactersRaw from "../../data/characters.json";
import recommendationsRaw from "../../data/recommendations.json";

type OptionKey = string;

interface ChipOption {
  key: OptionKey;
  label: string;
}

interface LocalizedText {
  ko: string;
  en: string;
  ja: string;
}

interface CharacterMeta {
  id: string;
  name: LocalizedText;
  imageKey: string;
}

interface CharacterRule {
  characterId: string;
  artifactSets: string[];
  mainStats: string[];
  validSubStats: string[];
}

const characters: CharacterMeta[] = (charactersRaw as { characters: CharacterMeta[] }).characters;
const rules: CharacterRule[] = (recommendationsRaw as { rules: CharacterRule[] }).rules;

const characterImageModules: Record<string, { default: string }> = import.meta.glob(
  "../../assets/characters/*.{svg,png,jpg,jpeg,webp}",
  { eager: true }
);

function getCharacterImageUrl(imageKey: string): string | null {
  const svgPath: string = `../../assets/characters/${imageKey}.svg`;
  const pngPath: string = `../../assets/characters/${imageKey}.png`;
  const jpgPath: string = `../../assets/characters/${imageKey}.jpg`;
  const jpegPath: string = `../../assets/characters/${imageKey}.jpeg`;
  const webpPath: string = `../../assets/characters/${imageKey}.webp`;

  const hit =
    characterImageModules[svgPath] ??
    characterImageModules[pngPath] ??
    characterImageModules[jpgPath] ??
    characterImageModules[jpegPath] ??
    characterImageModules[webpPath];

  return hit?.default ?? null;
}

interface ChipSelectSectionProps {
  title: string;
  options: ChipOption[];
  selectedKeys: OptionKey[];
  maxSelected: number;
  onChangeSelectedKeys: (nextSelectedKeys: OptionKey[]) => void;
  helperText?: string;
  disabledKeys?: OptionKey[];
}

function ChipSelectSection(props: ChipSelectSectionProps): JSX.Element {
  const selectedCount: number = props.selectedKeys.length;

  function handleToggleOption(optionKey: OptionKey): void {
    const isForceDisabled: boolean = props.disabledKeys ? props.disabledKeys.includes(optionKey) : false;
    if (isForceDisabled) {
      return;
    }

    const isSelected: boolean = props.selectedKeys.includes(optionKey);

    if (isSelected) {
      const nextSelectedKeys: OptionKey[] = props.selectedKeys.filter((key) => key !== optionKey);
      props.onChangeSelectedKeys(nextSelectedKeys);
      return;
    }

    if (props.maxSelected === 1) {
      props.onChangeSelectedKeys([optionKey]);
      return;
    }

    if (selectedCount >= props.maxSelected) {
      return;
    }

    const nextSelectedKeys: OptionKey[] = [...props.selectedKeys, optionKey];
    props.onChangeSelectedKeys(nextSelectedKeys);
  }

  function isOptionDisabled(optionKey: OptionKey): boolean {
    const isForceDisabled: boolean = props.disabledKeys ? props.disabledKeys.includes(optionKey) : false;
    if (isForceDisabled) {
      return true;
    }

    const isSelected: boolean = props.selectedKeys.includes(optionKey);

    if (isSelected) {
      return false;
    }

    if (props.maxSelected === 1) {
      return false;
    }

    return selectedCount >= props.maxSelected;
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-800">{props.title}</h3>
        <span className="text-[12px] text-slate-400">{selectedCount}개 선택됨</span>
      </div>

      {props.helperText ? (
        <div className="mb-3 text-[12px] text-slate-400">{props.helperText}</div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {props.options.map((option) => {
          const isSelected: boolean = props.selectedKeys.includes(option.key);
          const disabled: boolean = isOptionDisabled(option.key);

          const baseClassName: string =
            "h-10 rounded-full px-5 text-[14px] font-medium transition shadow-sm border focus:outline-none";
          const selectedClassName: string =
            "!bg-blue-600 text-white border-blue-700 ring-1 ring-blue-300";
          const unselectedClassName: string =
            "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
          const disabledClassName: string = "opacity-40 cursor-not-allowed";

          let className: string = baseClassName;

          if (isSelected) {
            className = `${className} ${selectedClassName}`;
          } else {
            className = `${className} ${unselectedClassName}`;
          }

          if (disabled) {
            className = `${className} ${disabledClassName}`;
          }

          return (
            <button
              key={option.key}
              type="button"
              className={className}
              onClick={() => {
                handleToggleOption(option.key);
              }}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface LabeledSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (nextValue: string) => void;
}

function LabeledSelect(props: LabeledSelectProps): JSX.Element {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-800">{props.label}</h3>
      </div>

      <div className="relative">
        <select
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-[14px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={props.value}
          onChange={(event) => {
            props.onChange(event.target.value);
          }}
        >
          {props.options.map((option) => {
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          ▼
        </div>
      </div>
    </div>
  );
}

export default function ArtifactRecommenderPage(): JSX.Element {
  // locale state (ko/en/ja)
  const [locale, setLocale] = React.useState<"ko" | "en" | "ja">("ko");

  // load lists from JSON data and localize
  const artifactSetOptions = getArtifactSetOptions(locale);
  const mainStatOptions = getMainStatOptions(locale);
  const subStatOptions = getSubStatOptions(locale);

  // UI text strings that also need translation
  const uiText = {
    artifactSetLabel: { ko: "성유물 세트", en: "Artifact Set", ja: "聖遺物セット" },
    artifactSetHelper: {
      ko: "세트는 여러 개 선택 가능합니다. 선택을 해제하려면 같은 버튼을 다시 누르세요.",
      en: "You can select multiple sets. Click a selected one again to clear.",
      ja: "セットは複数選択できます。もう一度押すと解除できます。",
    },
    artifactSetSearchPlaceholder: {
      ko: "세트 이름 검색...",
      en: "Search sets...",
      ja: "セット名を検索...",
    },
    mainOptionTitle: { ko: "주옵션", en: "Main stat", ja: "メインオプション" },
    mainOptionHelper: {
      ko: "주옵션은 1개만 선택 가능합니다.",
      en: "Only one main stat may be selected.",
      ja: "メインオプションは1つだけ選択できます。",
    },
    subOptionTitle: { ko: "부옵션", en: "Sub stats", ja: "サブオプション" },
    subOptionHelper: {
      ko: "부옵션은 최대 4개까지 선택 가능합니다.",
      en: "You can select up to 4 sub stats.",
      ja: "サブオプションは最大4つまで選択できます。",
    },
    recommendationTitle: { ko: "추천 캐릭터", en: "Recommended Characters", ja: "おすすめキャラ" },
    recommendationHint: {
      ko: "주옵션이 일치하고, 부옵션이 3개 이상 유효하면 추천됩니다.",
      en: "A character is recommended when the main stat matches and 3+ sub stats are valid.",
      ja: "メインが一致し、サブが3つ以上有効ならおすすめします。",
    },
    noRecommendation: {
      ko: "아직 추천할 수 있는 캐릭터가 없어요. 세트/주옵션/부옵션을 더 골라보세요.",
      en: "No matching character yet. Try selecting a set, a main stat, and sub stats.",
      ja: "まだおすすめがありません。セット/メイン/サブを選んでください。",
    },
    validOptionCountMessage: {
      ko: "옵션 {count}개 유효",
      en: "{count} valid sub stats",
      ja: "有効オプション {count}個",
    },
    validOptionMaxSuffix: {
      ko: "(최대)",
      en: "(max)",
      ja: "（最大）",
    },
    languageLabel: { ko: "언어", en: "Language", ja: "言語" },
  };

  const artifactSetChipOptions: ChipOption[] = artifactSetOptions
    .filter((option) => option.value !== "none")
    .map((option) => ({ key: option.value, label: option.label }));

  const [artifactSetSearchText, setArtifactSetSearchText] = React.useState<string>("");

  const normalizedArtifactSetQuery: string = artifactSetSearchText.trim().toLowerCase();

  let filteredArtifactSetChipOptions: ChipOption[] = artifactSetChipOptions;
  if (normalizedArtifactSetQuery) {
    filteredArtifactSetChipOptions = artifactSetChipOptions.filter((option) => {
      return option.label.toLowerCase().includes(normalizedArtifactSetQuery);
    });
  }

const [selectedArtifactSetKeys, setSelectedArtifactSetKeys] = React.useState<OptionKey[]>([]);
  const [selectedMainStatKeys, setSelectedMainStatKeys] = React.useState<OptionKey[]>([]);
  const [selectedSubStatKeys, setSelectedSubStatKeys] = React.useState<OptionKey[]>([]);

  const selectedMainStatKey: string | null = selectedMainStatKeys[0] ?? null;

  const subStatLabelByKey: Map<string, string> = new Map(
    subStatOptions.map((option) => [option.key, option.label])
  );

  const artifactSetLabelByKey: Map<string, string> = new Map(
    artifactSetOptions
      .filter((option) => option.value !== "none")
      .map((option) => [option.value, option.label])
  );

  const mainStatLabelByKey: Map<string, string> = new Map(
    mainStatOptions.map((option) => [option.key, option.label])
  );

  const recommendedCharacters = React.useMemo(() => {
    if (!selectedMainStatKey) {
      return [];
    }

    if (selectedArtifactSetKeys.length <= 0) {
      return [];
    }

    const results: Array<{
      characterId: string;
      validSubStatKeys: string[];
      matchedSetKeys: string[];
      maxValidSubStatCount: number;
    }> = [];

    for (const rule of rules) {
      const matchedSetKeys: string[] = selectedArtifactSetKeys.filter((selectedKey) =>
        rule.artifactSets.includes(selectedKey)
      );

      if (matchedSetKeys.length <= 0) {
        continue;
      }

      const mainMatches: boolean = rule.mainStats.includes(selectedMainStatKey);
      if (!mainMatches) {
        continue;
      }

      // NOTE:
      // - Sub stats cannot include the selected main stat (we also actively disable it in the UI).
      // - Some characters' rule data may include the same stat in both mainStats and validSubStats.
      //   In that case, the *effective* valid sub stat pool should exclude the selected main stat,
      //   otherwise the "max valid" count becomes impossible to reach.
      const effectiveValidSubStats: string[] = rule.validSubStats.filter((key) => key !== selectedMainStatKey);

      const validSubStatKeys: string[] = selectedSubStatKeys.filter((key) =>
        effectiveValidSubStats.includes(key)
      );

      const maxValidSubStatCount: number = Math.min(4, effectiveValidSubStats.length);
      const selectedSubStatCount: number = selectedSubStatKeys.length;
      const validSubStatCount: number = validSubStatKeys.length;

      const passesValidSubStatCheck: boolean =
        maxValidSubStatCount >= 3
          ? validSubStatCount >= 3
          : selectedSubStatCount === maxValidSubStatCount && validSubStatCount === maxValidSubStatCount;

      if (!passesValidSubStatCheck) {
        continue;
      }

      results.push({ characterId: rule.characterId, validSubStatKeys, matchedSetKeys, maxValidSubStatCount });

    }

    return results;
  }, [selectedArtifactSetKeys, selectedMainStatKey, selectedSubStatKeys]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-190">
        <div className="rounded-[28px] bg-white p-10 shadow-sm">
          {/* 세트 이름 콤보박스 */}
          {/* language selector for demonstration */}
          <LabeledSelect
            label={uiText.languageLabel[locale]}
            value={locale}
            options={[
              { value: "ko", label: "한국어" },
              { value: "en", label: "English" },
              { value: "ja", label: "日本語" },
            ]}
            onChange={(next) => {
              setLocale(next as Locale);
            }}
          />

          {/* 세트 이름: 1개만 선택 */}
          <div className="mb-4">
            <input
              type="text"
              value={artifactSetSearchText}
              onChange={(event) => {
                setArtifactSetSearchText(event.target.value);
              }}
              placeholder={uiText.artifactSetSearchPlaceholder[locale]}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <ChipSelectSection
            title={uiText.artifactSetLabel[locale]}
            options={filteredArtifactSetChipOptions}
            selectedKeys={selectedArtifactSetKeys}
            maxSelected={10}
            helperText={uiText.artifactSetHelper[locale]}
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedArtifactSetKeys(nextSelectedKeys);
            }}
          />

          {/* 주옵션: 1개만 선택 */}
          <ChipSelectSection
            title={uiText.mainOptionTitle[locale]}
            options={mainStatOptions}
            selectedKeys={selectedMainStatKeys}
            maxSelected={1}
            helperText={uiText.mainOptionHelper[locale]}
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedMainStatKeys(nextSelectedKeys);

              const nextMainStatKey: string | null = nextSelectedKeys[0] ?? null;
              if (nextMainStatKey) {
                setSelectedSubStatKeys((previousSubStatKeys) => {
                  return previousSubStatKeys.filter((key) => key !== nextMainStatKey);
                });
              }
            }}
          />

          {/* 부옵션: 최대 4개 선택 */}
          <ChipSelectSection
            title={uiText.subOptionTitle[locale]}
            options={subStatOptions}
            selectedKeys={selectedSubStatKeys}
            maxSelected={4}
            disabledKeys={selectedMainStatKey ? [selectedMainStatKey] : []}
            helperText={uiText.subOptionHelper[locale]}
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedSubStatKeys(nextSelectedKeys);
            }}
          />

          <div className="my-8 border-t border-slate-100" />

          {selectedArtifactSetKeys.length > 0 ? (
            <section>
              <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-800">
                {uiText.recommendationTitle[locale]}
              </h3>
            </div>
            <div className="mb-5 text-[12px] text-slate-400">{uiText.recommendationHint[locale]}</div>

            {recommendedCharacters.length <= 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[14px] text-slate-600">
                {uiText.noRecommendation[locale]}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recommendedCharacters.map((item) => {
                  const characterMeta: CharacterMeta | undefined = characters.find(
                    (character) => character.id === item.characterId
                  );

                  if (!characterMeta) {
                    return null;
                  }

                  const imageUrl: string | null = getCharacterImageUrl(characterMeta.imageKey);
                  const validCount: number = item.validSubStatKeys.length;
                  const messageTemplate: string = uiText.validOptionCountMessage[locale];
                  const isMaxValidSubStatSelection: boolean =
                    item.maxValidSubStatCount < 4 &&
                    selectedSubStatKeys.length === item.maxValidSubStatCount &&
                    validCount === selectedSubStatKeys.length;

                  let message: string = messageTemplate.replace("{count}", String(validCount));
                  if (isMaxValidSubStatSelection) {
                    message = `${message}${uiText.validOptionMaxSuffix[locale]}`;
                  }

                  const validLabels: string[] = item.validSubStatKeys.map((key) => {
                    return subStatLabelByKey.get(key) ?? key;
                  });

                  const matchedSetLabels: string[] = item.matchedSetKeys.map((key) => {
                    return artifactSetLabelByKey.get(key) ?? key;
                  });

                  const mainStatLabel: string = selectedMainStatKey
                    ? mainStatLabelByKey.get(selectedMainStatKey) ?? selectedMainStatKey
                    : "";

                  return (
                    <div
                      key={characterMeta.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={characterMeta.name[locale]}
                            className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50 object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50" />
                        )}

                        <div className="min-w-0">
                          <div className="truncate text-[16px] font-semibold text-slate-900">
                            {characterMeta.name[locale]}
                          </div>
                          <div className="mt-1 text-[13px] font-medium text-blue-700">{message}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.matchedSetKeys.map((setKey, index) => {
                          const label: string = matchedSetLabels[index] ?? setKey;
                          return (
                            <span
                              key={`set-${setKey}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-700"
                            >
                              {label}
                            </span>
                          );
                        })}

                        {mainStatLabel ? (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-800">
                            {mainStatLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {validLabels.map((label) => {
                          return (
                            <span
                              key={label}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-medium text-slate-700"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
