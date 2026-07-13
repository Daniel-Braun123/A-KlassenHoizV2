export function HistoricalMemberLabel({
  nickname,
  status,
}: {
  nickname: string | null;
  status: string | null;
}) {
  return (
    <>
      {nickname ?? "Gelöschtes Mitglied"}
      {status === "anonymized" ? (
        <span className="ranking-row__status"> · anonymisiert</span>
      ) : status && status !== "active" ? (
        <span className="ranking-row__status"> · ausgeschieden</span>
      ) : null}
    </>
  );
}
