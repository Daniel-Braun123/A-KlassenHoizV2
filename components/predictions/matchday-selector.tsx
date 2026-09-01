"use client";

import { useId, type ChangeEvent } from "react";

import { Icon } from "@/components/ui/icon";
import { Select } from "@/components/ui/select";

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
  options,
  selectedId,
}: Readonly<{
  disabled?: boolean;
  onSelect: (id: string) => void;
  options: MatchdayOption[];
  selectedId: string;
}>) {
  const selectedOption = options.find((option) => option.id === selectedId) ?? options[0];
  const selectedIndex = selectedOption
    ? options.findIndex((option) => option.id === selectedOption.id)
    : -1;
  const previousOption = selectedIndex > 0 ? options[selectedIndex - 1] : undefined;
  const nextOption = selectedIndex >= 0 ? options[selectedIndex + 1] : undefined;
  const availablePhases = (["first_leg", "second_leg"] as const).filter((phase) =>
    options.some((option) => option.phase === phase),
  );
  const matchdayId = useId();

  if (!selectedOption) return null;
  const currentOption = selectedOption;

  const phaseOptions = options.filter((option) => option.phase === currentOption.phase);
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

      <div className="matchday-switcher__matchday">
        <label className="matchday-switcher__label" htmlFor={matchdayId}>
          Spieltag
        </label>
        <div className="matchday-switcher__controls">
          <button
            aria-label={
              previousOption
                ? `Vorheriger Spieltag: ${optionAccessibleName(previousOption)}`
                : "Kein vorheriger Spieltag"
            }
            className="matchday-switcher__step matchday-switcher__step--previous"
            disabled={disabled || !previousOption}
            onClick={() => previousOption && onSelect(previousOption.id)}
            type="button"
          >
            <Icon className="icon" name="chevron-right" />
          </button>

          <select
            className="matchday-switcher__select"
            disabled={disabled}
            id={matchdayId}
            onChange={(event) => onSelect(event.currentTarget.value)}
            value={currentOption.id}
          >
            {phaseOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {optionLabel(option)}
              </option>
            ))}
          </select>

          <button
            aria-label={
              nextOption
                ? `Nächster Spieltag: ${optionAccessibleName(nextOption)}`
                : "Kein nächster Spieltag"
            }
            className="matchday-switcher__step"
            disabled={disabled || !nextOption}
            onClick={() => nextOption && onSelect(nextOption.id)}
            type="button"
          >
            <Icon className="icon" name="chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
