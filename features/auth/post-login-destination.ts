import { normalizeAuthRedirect } from "@/features/auth/redirects";

export type RoundDestination = Readonly<{ id: string; wasLastActive: boolean }>;

export function resolvePostLoginDestination(
  rounds: readonly RoundDestination[],
  requestedNext?: string | null,
): string {
  const next = normalizeAuthRedirect(requestedNext);
  if (next.startsWith("/invite/")) return next;
  if (rounds.length === 0) return "/start";
  if (rounds.length === 1) return `/rounds/${rounds[0]?.id}`;
  const preferred = rounds.find((round) => round.wasLastActive) ?? rounds[0];
  return `/rounds/${preferred?.id}`;
}
