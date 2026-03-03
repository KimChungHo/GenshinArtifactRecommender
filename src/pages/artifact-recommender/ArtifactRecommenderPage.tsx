import React, { type JSX } from "react";
import {
  getArtifactSetOptions,
  getMainStatOptions,
  getSubStatOptions,
  type Locale,
} from "../../data/artifactOptions";

type OptionKey = string;

interface ChipOption {
  key: OptionKey;
  label: string;
}

interface ChipSelectSectionProps {
  title: string;
  options: ChipOption[];
  selectedKeys: OptionKey[];
  maxSelected: number;
  onChangeSelectedKeys: (nextSelectedKeys: OptionKey[]) => void;
  helperText?: string;
}

function ChipSelectSection(props: ChipSelectSectionProps): JSX.Element {
  const selectedCount: number = props.selectedKeys.length;

  function handleToggleOption(optionKey: OptionKey): void {
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
    languageLabel: { ko: "언어", en: "Language", ja: "言語" },
  };

  const [selectedArtifactSetKey, setSelectedArtifactSetKey] = React.useState<string>("none");
  const [selectedMainStatKeys, setSelectedMainStatKeys] = React.useState<OptionKey[]>([]);
  const [selectedSubStatKeys, setSelectedSubStatKeys] = React.useState<OptionKey[]>([]);

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

          <LabeledSelect
            label={uiText.artifactSetLabel[locale]}
            value={selectedArtifactSetKey}
            options={artifactSetOptions}
            onChange={(nextValue) => {
              setSelectedArtifactSetKey(nextValue);
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
            }}
          />

          {/* 부옵션: 최대 4개 선택 */}
          <ChipSelectSection
            title={uiText.subOptionTitle[locale]}
            options={subStatOptions}
            selectedKeys={selectedSubStatKeys}
            maxSelected={4}
            helperText={uiText.subOptionHelper[locale]}
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedSubStatKeys(nextSelectedKeys);
            }}
          />
        </div>
      </div>
    </div>
  );
}