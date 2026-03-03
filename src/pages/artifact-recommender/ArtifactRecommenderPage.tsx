import React, { type JSX } from "react";

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
  // 1) 세트 이름 콤보박스 (예시 데이터)
  const artifactSetOptions: Array<{ value: string; label: string }> = [
    { value: "none", label: "세트 선택" },
    { value: "gladiator", label: "검투사의 피날레" },
    { value: "wanderer", label: "대지를 유랑하는 악단" },
    { value: "emblem", label: "절연의 기치" },
    { value: "deepwood", label: "숲의 기억" },
  ];

  // 2) 주옵션/부옵션 (예시 데이터 - 원하시는 목록으로 교체)
  const mainStatOptions: ChipOption[] = [
    { key: "atk_percent", label: "공격력%" },
    { key: "hp_percent", label: "생명력%" },
    { key: "def_percent", label: "방어력%" },
    { key: "er", label: "원소 충전 효율" },
    { key: "em", label: "원소 마스터리" },
    { key: "crit_rate", label: "치명타 확률" },
    { key: "crit_dmg", label: "치명타 피해" },
    { key: "healing", label: "치유 보너스" },
    { key: "pyro", label: "불 원소 피해" },
    { key: "hydro", label: "물 원소 피해" },
    { key: "electro", label: "번개 원소 피해" },
    { key: "cryo", label: "얼음 원소 피해" },
    { key: "anemo", label: "바람 원소 피해" },
    { key: "geo", label: "바위 원소 피해" },
    { key: "dendro", label: "풀 원소 피해" },
    { key: "physical", label: "물리 피해" },
  ];

  const subStatOptions: ChipOption[] = [
    { key: "atk_flat", label: "공격력" },
    { key: "atk_percent", label: "공격력%" },
    { key: "hp_flat", label: "생명력" },
    { key: "hp_percent", label: "생명력%" },
    { key: "def_flat", label: "방어력" },
    { key: "def_percent", label: "방어력%" },
    { key: "er", label: "원소 충전 효율" },
    { key: "em", label: "원소 마스터리" },
    { key: "crit_rate", label: "치명타 확률" },
    { key: "crit_dmg", label: "치명타 피해" },
  ];

  const [selectedArtifactSetKey, setSelectedArtifactSetKey] = React.useState<string>("none");
  const [selectedMainStatKeys, setSelectedMainStatKeys] = React.useState<OptionKey[]>([]);
  const [selectedSubStatKeys, setSelectedSubStatKeys] = React.useState<OptionKey[]>([]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-[760px]">
        <div className="rounded-[28px] bg-white p-10 shadow-sm">
          {/* 세트 이름 콤보박스 */}
          <LabeledSelect
            label="성유물 세트"
            value={selectedArtifactSetKey}
            options={artifactSetOptions}
            onChange={(nextValue) => {
              setSelectedArtifactSetKey(nextValue);
            }}
          />

          {/* 주옵션: 1개만 선택 */}
          <ChipSelectSection
            title="주옵션"
            options={mainStatOptions}
            selectedKeys={selectedMainStatKeys}
            maxSelected={1}
            helperText="주옵션은 1개만 선택 가능합니다."
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedMainStatKeys(nextSelectedKeys);
            }}
          />

          {/* 부옵션: 최대 4개 선택 */}
          <ChipSelectSection
            title="부옵션"
            options={subStatOptions}
            selectedKeys={selectedSubStatKeys}
            maxSelected={4}
            helperText="부옵션은 최대 4개까지 선택 가능합니다."
            onChangeSelectedKeys={(nextSelectedKeys) => {
              setSelectedSubStatKeys(nextSelectedKeys);
            }}
          />
        </div>
      </div>
    </div>
  );
}