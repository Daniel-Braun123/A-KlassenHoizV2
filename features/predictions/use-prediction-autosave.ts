"use client";

import { useEffect, useReducer, useRef, useState } from "react";

import { savePredictionAction } from "./actions";
import { initialAutosaveState, reduceAutosaveState, type AutosaveState } from "./autosave-state";
import { useConnectivity } from "./connectivity";

type Options = Readonly<{
  roundId: string;
  matchId: string;
  initialHomeGoals: number | null;
  initialAwayGoals: number | null;
  open: boolean;
}>;

export function usePredictionAutosave(options: Options) {
  const [homeGoals, setHomeGoals] = useState<number | undefined>(
    options.initialHomeGoals ?? undefined,
  );
  const [awayGoals, setAwayGoals] = useState<number | undefined>(
    options.initialAwayGoals ?? undefined,
  );
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, dispatch] = useReducer(
    reduceAutosaveState,
    options.initialHomeGoals === null || options.initialAwayGoals === null
      ? initialAutosaveState
      : ({
          status: options.open ? "saved" : "locked",
          homeGoals: options.initialHomeGoals,
          awayGoals: options.initialAwayGoals,
        } satisfies AutosaveState),
  );
  const online = useConnectivity();
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    if (!options.open) {
      dispatch({ type: "locked" });
      return;
    }
    if (homeGoals === undefined || awayGoals === undefined) return;

    const timeout = window.setTimeout(() => {
      if (!online) {
        dispatch({ type: "offline" });
        return;
      }
      const requestId = crypto.randomUUID();
      dispatch({ type: "saving", requestId });
      queue.current = queue.current.then(async () => {
        const result = await savePredictionAction({
          roundId: options.roundId,
          matchId: options.matchId,
          homeGoals,
          awayGoals,
          idempotencyKey: requestId,
        });
        if (result.ok) dispatch({ type: "saved", requestId });
        else if (result.error.code === "DEADLINE_PASSED") dispatch({ type: "locked" });
        else dispatch({ type: "failed", requestId, message: result.error.message });
      });
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [awayGoals, homeGoals, online, options.matchId, options.open, options.roundId, retryVersion]);

  const updateHomeGoals = (value: number | undefined) => {
    setHomeGoals(value);
    dispatch({ type: "changed", homeGoals: value, awayGoals });
  };
  const updateAwayGoals = (value: number | undefined) => {
    setAwayGoals(value);
    dispatch({ type: "changed", homeGoals, awayGoals: value });
  };
  const retry = () => {
    dispatch({ type: "retry" });
    setRetryVersion((value) => value + 1);
  };

  return { state, homeGoals, awayGoals, updateHomeGoals, updateAwayGoals, retry, online };
}
