import { RoundNavigation } from "@/components/patterns/round-navigation";
export default async function RoundLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  return (
    <div className="round-shell">
      <RoundNavigation roundId={roundId} />
      {children}
    </div>
  );
}
