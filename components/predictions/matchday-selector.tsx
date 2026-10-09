"use client";

import type { ChangeEvent } from "react";

import { MatchdaySelect } from "@/components/ui/matchday-select";
import { Select } from "@/components/ui/select";
import { compareMatchdays } from "@/features/competition/matchday-period";

export type MatchdayPhase = "first_leg" | "second_leg";

export type MatchdayOption = Readonly<{
  id: string;
  number: number;
  label: string;
  incomplete: boolean;
  phase: MatchdayPhase;
  startsOn: string;
  endsOn: string;
}>;

const phaseLabels: Record<MatchdayPhase, string> = {
  first_leg: "Hinrunde",
  second_leg: "Rückrunde",
};

function optionAccessibleName(option: MatchdayOption): string {
  return `${phaseLabels[option.phase]} · Spieltag ${option.number}${option.incomplete ? ", offen" : ""}`;
}

function optionLabel(option: MatchdayOption): string {
  return `Spieltag ${option.number}${option.incomplete ? " · offen" : ""}`;
}

export function MatchdaySelector({
  disabled = false,
  onSelect,
  options: unsortedOptions,
  selectedId,
}: Readonly<{
  disabled?: boolean;
  onSelect: (id: string) => void;
  options: MatchdayOption[];
  selectedId: string;
}>) {
  const options = unsortedOptions.toSorted(compareMatchdays);
  const selectedOption = options.find((option) => option.id === selectedId) ?? options[0];
  const availablePhases = (["first_leg", "second_leg"] as const).filter((phase) =>
    options.some((option) => option.phase === phase),
  );

  if (!selectedOption) return null;
  const currentOption = selectedOption;

  const navigationOptions = options.map((option) => ({
    ...option,
    label: optionLabel(option),
    accessibleLabel: optionAccessibleName(option),
  }));
  const phaseOptions = navigationOptions.filter((option) => option.phase === currentOption.phase);
  const showPhaseSelector = availablePhases.includes("second_leg");

  function selectPhase(event: ChangeEvent<HTMLSelectElement>): void {
    const phase = event.currentTarget.value as MatchdayPhase;
    const optionsForPhase = options.filter((option) => option.phase === phase);
    const target =
      optionsForPhase.find((option) => option.number === currentOption.number) ??
      optionsForPhase[0];

    if (target && target.id !== selectedId) onSelect(target.id);
  }

  return (
    <div className={`matchday-switcher${showPhaseSelector ? "" : " matchday-switcher--single"}`}>
      {showPhaseSelector ? (
        <div className="matchday-switcher__phase">
          <Select
            disabled={disabled}
            label="Runde"
            onChange={selectPhase}
            value={currentOption.phase}
          >
            {availablePhases.map((phase) => (
              <option key={phase} value={phase}>
                {phaseLabels[phase]}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <MatchdaySelect
        disabled={disabled}
        navigationOptions={navigationOptions}
        onSelect={onSelect}
        options={phaseOptions}
        selectedId={currentOption.id}
      />
    </div>
  );
}
