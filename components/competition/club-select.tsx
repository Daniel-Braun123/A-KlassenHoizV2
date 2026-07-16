"use client";

import { useId, useRef } from "react";

import { ClubLogo } from "@/components/competition/club-logo";
import { Icon } from "@/components/ui/icon";

export type ClubSelectOption = Readonly<{
  id: string;
  logoUrl: string | null;
  name: string;
}>;

export function ClubSelect({
  clubs,
  disabled = false,
  disabledIds,
  label,
  name,
  onChange,
  value,
}: Readonly<{
  clubs: ClubSelectOption[];
  disabled?: boolean;
  disabledIds: ReadonlySet<string>;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}>) {
  const generatedId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const labelId = `${generatedId}-label`;
  const selectedClub = clubs.find((club) => club.id === value);

  function preventDisabledToggle(event: React.SyntheticEvent) {
    if (disabled) event.preventDefault();
  }

  function selectClub(clubId: string) {
    onChange(clubId);
    if (detailsRef.current) {
      detailsRef.current.open = false;
      detailsRef.current.querySelector<HTMLElement>("summary")?.focus();
    }
  }

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label} <span aria-hidden="true">*</span>
      </span>
      <input name={name} type="hidden" value={value} />
      <details
        className="club-select"
        data-disabled={disabled || undefined}
        data-dismissible-settings
        ref={detailsRef}
      >
        <summary
          aria-disabled={disabled}
          aria-labelledby={labelId}
          onClick={preventDisabledToggle}
          onKeyDown={preventDisabledToggle}
          tabIndex={disabled ? -1 : 0}
        >
          <span className="club-select__value">
            {selectedClub ? (
              <ClubLogo
                className="club-select__logo"
                logoUrl={selectedClub.logoUrl}
                name={selectedClub.name}
                size={24}
              />
            ) : null}
            <span className={selectedClub ? undefined : "club-select__placeholder"}>
              {selectedClub?.name ?? "Verein wählen"}
            </span>
          </span>
          <Icon className="club-select__chevron" name="chevron-right" />
        </summary>
        <ul aria-label={`${label}: Vereine`} className="club-select__options">
          {clubs.map((club) => {
            const optionDisabled = disabledIds.has(club.id);
            const selected = club.id === value;
            return (
              <li key={club.id}>
                <button
                  aria-current={selected ? "true" : undefined}
                  className="club-select__option"
                  disabled={optionDisabled}
                  onClick={() => selectClub(club.id)}
                  type="button"
                >
                  <ClubLogo
                    className="club-select__logo"
                    logoUrl={club.logoUrl}
                    name={club.name}
                    size={24}
                  />
                  <span>{club.name}</span>
                  {selected ? <span className="visually-hidden">Ausgewählt</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
