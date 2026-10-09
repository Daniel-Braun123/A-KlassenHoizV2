"use client";

import { useId } from "react";

import { Icon } from "@/components/ui/icon";

export type MatchdaySelectOption = Readonly<{
  id: string;
  label: string;
  accessibleLabel?: string;
}>;

export function MatchdaySelect({
  busy = false,
  disabled = false,
  label = "Spieltag",
  onSelect,
  options,
  navigationOptions = options,
  selectedId,
}: Readonly<{
  busy?: boolean;
  disabled?: boolean;
  label?: string;
  navigationOptions?: readonly MatchdaySelectOption[];
  onSelect: (id: string) => void;
  options: readonly MatchdaySelectOption[];
  selectedId: string;
}>) {
  const id = useId();
  const selectedIndex = navigationOptions.findIndex((option) => option.id === selectedId);
  const previous = selectedIndex > 0 ? navigationOptions[selectedIndex - 1] : undefined;
  const next = selectedIndex >= 0 ? navigationOptions[selectedIndex + 1] : undefined;

  return (
    <div className="matchday-switcher__matchday">
      <label className="matchday-switcher__label" htmlFor={id}>
        {label}
      </label>
      <div className="matchday-switcher__controls">
        <button
          aria-label={
            previous
              ? `Vorheriger Spieltag: ${previous.accessibleLabel ?? previous.label}`
              : "Kein vorheriger Spieltag"
          }
          className="matchday-switcher__step matchday-switcher__step--previous"
          disabled={disabled || !previous}
          onClick={() => previous && onSelect(previous.id)}
          type="button"
        >
          <Icon className="icon" name="chevron-right" />
        </button>
        <select
          aria-busy={busy}
          className="matchday-switcher__select"
          disabled={disabled}
          id={id}
          onChange={(event) => onSelect(event.currentTarget.value)}
          value={selectedId}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          aria-label={
            next
              ? `Nächster Spieltag: ${next.accessibleLabel ?? next.label}`
              : "Kein nächster Spieltag"
          }
          className="matchday-switcher__step"
          disabled={disabled || !next}
          onClick={() => next && onSelect(next.id)}
          type="button"
        >
          <Icon className="icon" name="chevron-right" />
        </button>
      </div>
    </div>
  );
}
