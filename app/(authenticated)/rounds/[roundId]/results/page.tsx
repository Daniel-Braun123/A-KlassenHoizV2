import type { Route } from "next";
import { redirect } from "next/navigation";

export default async function ResultsPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  redirect(`/rounds/${roundId}/table` as Route);
}
