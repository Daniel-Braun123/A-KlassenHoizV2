/** A presentation preference only: membership and access are always checked separately. */
export function applyRoundOrder<T extends { id: string | null }>(
  rounds: T[],
  preference: unknown,
): T[] {
  if (!Array.isArray(preference)) return rounds;
  const positions = new Map<string, number>();
  for (const id of preference) {
    if (typeof id === "string" && !positions.has(id)) positions.set(id, positions.size);
  }
  return [...rounds].sort(
    (a, b) => (positions.get(a.id ?? "") ?? Infinity) - (positions.get(b.id ?? "") ?? Infinity),
  );
}
