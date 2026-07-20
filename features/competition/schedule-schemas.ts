import { z } from "zod";

const uuid = z.string().uuid();
const version = z.coerce.number().int().positive();
const phase = z.enum(["first_leg", "second_leg"]);
const status = z.enum(["draft", "published", "postponed", "cancelled", "completed", "abandoned"]);
const dateOnly = z.iso.date();

const matchdayPeriodFields = {
  startsOn: dateOnly,
  endsOn: dateOnly,
} as const;

const validPeriod = <T extends { startsOn: string; endsOn: string }>(value: T) =>
  value.startsOn <= value.endsOn;

export const createMatchdayAutoSchema = z
  .object({
    leagueId: uuid,
    phase,
    ...matchdayPeriodFields,
  })
  .refine(validPeriod, {
    message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    path: ["endsOn"],
  });

export const updateMatchdayPeriodSchema = z
  .object({
    id: uuid,
    expectedVersion: version,
    ...matchdayPeriodFields,
  })
  .refine(validPeriod, {
    message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    path: ["endsOn"],
  });

export const moveMatchdayPhaseSchema = z.object({
  id: uuid,
  expectedVersion: version,
  phase,
});

export const deleteScheduleItemSchema = z.object({
  id: uuid,
  expectedVersion: version,
});

const simpleMatchFields = {
  homeClubId: uuid,
  awayClubId: uuid,
  kickoffAt: z.iso.datetime({ offset: true }),
} as const;

const differentClubs = <T extends { homeClubId: string; awayClubId: string }>(value: T) =>
  value.homeClubId !== value.awayClubId;

export const createSimpleMatchSchema = z
  .object({ matchdayId: uuid, ...simpleMatchFields })
  .refine(differentClubs, {
    message: "Heim- und Auswärtsteam müssen verschieden sein.",
  });

export const updateSimpleMatchSchema = z
  .object({ ...simpleMatchFields, id: uuid, expectedVersion: version, status })
  .refine(differentClubs, {
    message: "Heim- und Auswärtsteam müssen verschieden sein.",
  });

export type MatchdayPhase = z.infer<typeof phase>;
export type SimpleMatchStatus = z.infer<typeof status>;
