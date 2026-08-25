import { RoundNavigation } from "@/components/patterns/round-navigation";
import { RoundLiveUpdates } from "@/components/realtime/round-live-updates";
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
      <RoundLiveUpdates roundId={roundId} />
      <RoundNavigation roundId={roundId} />
      {children}
    </div>
  );
}
