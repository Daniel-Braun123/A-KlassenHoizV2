import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PredictionCard } from "@/components/predictions/prediction-card";
import type { PredictionSheetRow } from "@/features/predictions/types";

afterEach(cleanup);

const match = {
  away_club_name: "SV Auswärts",
  away_logo_path: null,
  away_logo_url: "https://images.example.test/away.png",
  home_club_name: "FC Heim",
  home_logo_path: null,
  home_logo_url: "https://images.example.test/home.png",
  is_open: true,
  kickoff_at: "2099-07-24T17:00:00.000Z",
  match_id: "10000000-0000-4000-8000-000000000001",
  match_status: "published",
  predicted_away_goals: null,
  predicted_home_goals: null,
  round_id: "20000000-0000-4000-8000-000000000001",
} as PredictionSheetRow;

describe("PredictionCard", () => {
  it("zeigt die direkten Logo-URLs aus der zentralen Vereinsverwaltung", () => {
    const { container } = render(
      <PredictionCard
        awayGoals=""
        homeGoals=""
        match={match}
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    const logos = container.querySelectorAll<HTMLImageElement>(".prediction-club img");
    expect(logos).toHaveLength(2);
    expect(logos[0]).toHaveAttribute("src", "https://images.example.test/home.png");
    expect(logos[1]).toHaveAttribute("src", "https://images.example.test/away.png");
  });

  it("zeigt nur die Uhrzeit und keinen Geplant- oder Speicherstatus pro Spiel", () => {
    render(
      <PredictionCard
        awayGoals=""
        homeGoals=""
        match={match}
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    expect(document.querySelector("time")).toHaveTextContent("19:00");
    expect(document.body).not.toHaveTextContent("Geplant");
    expect(document.body).not.toHaveTextContent("Tipp unvollständig");
    expect(document.body).not.toHaveTextContent("Gespeichert");
  });

  it("zeigt nach dem offiziellen Ergebnis Endstand, eigenen Tipp und Punkte kompakt", () => {
    render(
      <PredictionCard
        awayGoals="1"
        homeGoals="2"
        match={
          {
            ...match,
            is_open: false,
            match_status: "completed",
            prediction_points: 4,
            result_away_goals: 1,
            result_decision: "official",
            result_home_goals: 2,
            result_is_correction: false,
            result_revision_no: 1,
          } as PredictionSheetRow
        }
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    expect(document.body).toHaveTextContent("Endstand");
    expect(document.body).toHaveTextContent("2 : 1");
    expect(document.body).toHaveTextContent("Tipp 2:1");
    expect(document.body).toHaveTextContent("+4 P");
    expect(document.querySelectorAll("input")).toHaveLength(0);
  });

  it("kennzeichnet korrigierte Punkte und Ergebnisse", () => {
    render(
      <PredictionCard
        awayGoals="1"
        homeGoals="2"
        match={
          {
            ...match,
            is_open: false,
            match_status: "completed",
            prediction_points: 2,
            result_away_goals: 1,
            result_decision: "official",
            result_home_goals: 3,
            result_is_correction: true,
            result_revision_no: 2,
          } as PredictionSheetRow
        }
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    expect(document.body).toHaveTextContent("3 : 1");
    expect(document.body).toHaveTextContent("+2 P");
    expect(document.body).toHaveTextContent("Korrigiert");
  });

  it("zeigt null Punkte neutral statt als Erfolg", () => {
    const { container } = render(
      <PredictionCard
        awayGoals="0"
        homeGoals="0"
        match={
          {
            ...match,
            is_open: false,
            match_status: "completed",
            prediction_points: 0,
            result_away_goals: 2,
            result_decision: "official",
            result_home_goals: 1,
            result_is_correction: false,
            result_revision_no: 1,
          } as PredictionSheetRow
        }
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    expect(document.body).toHaveTextContent("0 P");
    expect(container.querySelector(".prediction-card__points--zero")).not.toBeNull();
  });

  it("zeigt bei einem ausgeschlossenen Spiel keine Punkte", () => {
    render(
      <PredictionCard
        awayGoals="1"
        homeGoals="2"
        match={
          {
            ...match,
            is_open: false,
            match_status: "completed",
            prediction_points: null,
            result_away_goals: null,
            result_decision: "excluded",
            result_home_goals: null,
            result_is_correction: false,
            result_revision_no: 1,
          } as PredictionSheetRow
        }
        onAwayGoalsChange={vi.fn()}
        onHomeGoalsChange={vi.fn()}
        pending={false}
        visiblePredictions={[]}
      />,
    );

    expect(document.body).toHaveTextContent("Ohne Wertung");
    expect(document.body).toHaveTextContent("Tipp 2:1");
    expect(document.body).not.toHaveTextContent(/\+\d P/u);
  });
});
