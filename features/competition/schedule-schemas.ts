import { z } from "zod";

const uuid = z.string().uuid();
const version = z.coerce.number().int().positive();
const phase = z.enum(["first_leg", "second_leg"]);
const status = z.enum(["draft", "published", "postponed", "cancelled", "completed", "abandoned"]);

export const createMatchdayAutoSchema = z.object({
  leagueId: uuid,
  phase,
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
