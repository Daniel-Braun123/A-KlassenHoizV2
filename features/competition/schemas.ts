import { z } from "zod";

const trimmed = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);
const uuid = z.string().uuid();
const version = z.coerce.number().int().positive();

export const leagueSchema = z.object({
  name: trimmed(1, 120),
  shortName: trimmed(1, 20).optional(),
});
export const updateLeagueSchema = leagueSchema.extend({
  id: uuid,
  expectedVersion: version,
  status: z.enum(["draft", "active", "archived"]),
});
export const seasonSchema = z
  .object({
    label: trimmed(1, 40),
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
  })
  .refine((value) => value.startsOn <= value.endsOn, {
    message: "Das Enddatum liegt vor dem Startdatum.",
  });
export const updateSeasonSchema = seasonSchema.and(
  z.object({ id: uuid, expectedVersion: version, status: z.enum(["draft", "active", "archived"]) }),
);
export const leagueSeasonSchema = z.object({ leagueId: uuid, seasonId: uuid });
export const leagueSeasonTransitionSchema = z.object({
  id: uuid,
  expectedVersion: version,
  status: z.enum(["published", "completed", "archived"]),
});
export const clubSchema = z.object({ name: trimmed(1, 120), shortName: trimmed(1, 20) });
export const updateClubSchema = clubSchema.extend({
  id: uuid,
  expectedVersion: version,
  status: z.enum(["active", "archived"]),
});
export const clubAssignmentSchema = z.object({ leagueSeasonId: uuid, clubId: uuid });
export const matchdaySchema = z.object({
  leagueSeasonId: uuid,
  number: z.coerce.number().int().positive().max(999),
  displayName: z.string().trim().max(80).optional(),
});
export const updateMatchdaySchema = z.object({
  id: uuid,
  expectedVersion: version,
  number: z.coerce.number().int().positive().max(999),
  displayName: z.string().trim().max(80).optional(),
  status: z.enum(["draft", "published", "completed", "archived"]),
});
export const matchSchema = z
  .object({
    matchdayId: uuid,
    homeClubId: uuid,
    awayClubId: uuid,
    kickoffAt: z.iso.datetime({ offset: true }),
  })
  .refine((value) => value.homeClubId !== value.awayClubId, {
    message: "Heim- und Auswärtsteam müssen verschieden sein.",
  });
export const updateMatchSchema = matchSchema.extend({
  id: uuid,
  expectedVersion: version,
  status: z.enum(["draft", "published", "postponed", "cancelled", "completed", "abandoned"]),
});
export const resultSchema = z
  .object({
    matchId: uuid,
    expectedMatchVersion: version,
    expectedRevision: z.coerce.number().int().min(0),
    decision: z.enum(["official", "excluded"]),
    homeGoals: z.coerce.number().int().min(0).max(99).optional(),
    awayGoals: z.coerce.number().int().min(0).max(99).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.decision === "official" &&
      (value.homeGoals === undefined || value.awayGoals === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Für ein offizielles Ergebnis werden beide Torwerte benötigt.",
      });
    }
  });

export const logoSchema = z.object({
  clubId: uuid,
  expectedVersion: version,
  version,
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  size: z.number().int().min(1).max(2_097_152),
});
