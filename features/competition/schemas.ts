import { z } from "zod";

const trimmed = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);
const uuid = z.string().uuid();
const version = z.coerce.number().int().positive();

const clubIds = z
  .array(uuid)
  .min(2, "Wähle mindestens zwei Vereine aus.")
  .superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Jeder Verein darf nur einmal ausgewählt werden.",
      });
    }
  });

const leagueYear = z
  .string()
  .trim()
  .regex(/^\d{2}\/\d{2}$/, "Verwende das Format 26/27.")
  .refine((label) => {
    const [first, second] = label.split("/").map(Number);
    return first !== undefined && second !== undefined && (first + 1) % 100 === second;
  }, "Die Jahreszahlen müssen direkt aufeinanderfolgen.");

const optionalHttpsUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .url("Gib eine gültige Bild-URL ein.")
    .max(2048)
    .refine((value) => new URL(value).protocol === "https:", "Die Bild-URL muss HTTPS verwenden.")
    .optional(),
);

export const adminLeagueSchema = z.object({
  name: trimmed(1, 120),
  yearLabel: leagueYear,
  clubIds,
});

export const updateAdminLeagueSchema = adminLeagueSchema
  .extend({
    id: uuid,
    expectedVersion: version,
    hasPredictions: z.coerce.boolean().default(false),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.hasPredictions && !value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Begründe die Änderung, da bereits Tipps vorhanden sind.",
      });
    }
  });

export const publishAdminLeagueSchema = z.object({ id: uuid, expectedVersion: version });

export const clubSchema = z.object({
  name: trimmed(1, 120),
  logoUrl: optionalHttpsUrl,
});

export const updateClubSchema = clubSchema.extend({ id: uuid, expectedVersion: version });

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
