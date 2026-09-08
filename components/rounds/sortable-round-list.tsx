"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Route } from "next";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  KeyboardCode,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { NavigationPendingIndicator } from "@/components/ui/navigation-pending-indicator";
import { saveRoundOrderAction } from "@/features/rounds/order-actions";
import type { MyRound } from "@/features/rounds/types";
import type { ActionResult } from "@/lib/actions/result";
import "@/styles/sortable-rounds.css";

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const easing = "cubic-bezier(0.23, 1, 0.32, 1)";

function RoundCopy({ round }: { round: MyRound }) {
  return (
    <span className="round-list__copy">
      <strong>{round.name}</strong>
      <span className="round-list__meta">
        <span className="round-list__meta-primary">
          {round.league_name} · {round.season_label}
        </span>
        <span className="round-list__meta-separator" aria-hidden="true">
          ·
        </span>
        <span className="round-list__meta-role">
          {round.role === "owner" ? "Besitzer" : "Mitglied"}
        </span>
      </span>
    </span>
  );
}

function SortableRound({
  round,
  disabled,
  sortable,
  reducedMotion,
}: {
  round: MyRound;
  disabled: boolean;
  sortable: boolean;
  reducedMotion: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: round.id!,
    disabled: disabled || !sortable,
    transition: reducedMotion ? null : { duration: 200, easing },
  });
  return (
    <li
      ref={setNodeRef}
      className={`sortable-round${isDragging ? " sortable-round--dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <Link
        href={`/rounds/${round.id}` as Route}
        className="sortable-round__link"
        ref={setActivatorNodeRef}
        {...(sortable ? listeners : {})}
        aria-describedby={sortable ? attributes["aria-describedby"] : undefined}
        aria-roledescription={sortable ? "Verschiebbare Tipprunde" : undefined}
        data-sortable={sortable && !disabled ? "true" : undefined}
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onContextMenu={(event) => {
          if (isDragging) event.preventDefault();
        }}
      >
        <RoundCopy round={round} />
        <Icon className="round-list__chevron" name="chevron-right" />
        <NavigationPendingIndicator />
      </Link>
    </li>
  );
}

export function SortableRoundList({
  rounds,
  saveOrder = saveRoundOrderAction,
}: {
  rounds: MyRound[];
  saveOrder?: (ids: string[]) => Promise<ActionResult<null>>;
}) {
  const contextId = useId();
  const [items, setItems] = useState(rounds);
  const [previousRounds, setPreviousRounds] = useState(rounds);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [keyboardDrag, setKeyboardDrag] = useState(false);
  const busy = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const clickResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (rounds !== previousRounds && !saving && activeId === null) {
    setPreviousRounds(rounds);
    setItems(rounds);
  }
  useEffect(() => {
    // dnd-kit stops click propagation, but an anchor's native navigation also
    // needs cancelling after a drag (including long-press without movement).
    const preventDragClick = (event: MouseEvent) => {
      if (
        suppressClick.current &&
        event.target instanceof Node &&
        root.current?.contains(event.target)
      ) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }
    };
    document.addEventListener("click", preventDragClick, true);
    return () => {
      document.removeEventListener("click", preventDragClick, true);
      if (clickResetTimer.current) clearTimeout(clickResetTimer.current);
    };
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 7 } }),
    // Native scrolling wins unless a deliberate long press activates sorting first.
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );
  const activeRound = items.find((round) => round.id === activeId);

  async function move(from: number, to: number) {
    if (busy.current || from === to || from < 0 || to < 0 || to >= items.length) return;
    const previous = items;
    const next = arrayMove(items, from, to);
    busy.current = true;
    setSaving(true);
    setError("");
    setStatus("Reihenfolge wird gespeichert.");
    setItems(next);
    try {
      const result = await saveOrder(next.map((round) => round.id!));
      if (!result.ok) throw new Error(result.error.message);
      setStatus("Reihenfolge gespeichert.");
    } catch (cause) {
      setItems(previous);
      setStatus("");
      setError(
        `Die Reihenfolge wurde nicht gespeichert. ${cause instanceof Error ? cause.message : "Bitte versuche es erneut."}`,
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function finishGesture() {
    if (clickResetTimer.current) clearTimeout(clickResetTimer.current);
    clickResetTimer.current = setTimeout(() => {
      suppressClick.current = false;
    }, 400);
    setActiveId(null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    finishGesture();
    if (over)
      void move(
        items.findIndex((round) => round.id === active.id),
        items.findIndex((round) => round.id === over.id),
      );
  }

  return (
    <div className="sortable-rounds" ref={root}>
      <DndContext
        id={contextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[verticalOnly]}
        onDragStart={({ active, activatorEvent }) => {
          if (clickResetTimer.current) clearTimeout(clickResetTimer.current);
          suppressClick.current = !(activatorEvent instanceof KeyboardEvent);
          setError("");
          setKeyboardDrag(activatorEvent instanceof KeyboardEvent);
          setActiveId(String(active.id));
        }}
        onDragCancel={finishGesture}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Enter öffnet die Tipprunde. Zum Verschieben Leertaste drücken, mit den Pfeiltasten nach oben oder unten verschieben, mit Leertaste ablegen oder mit Escape abbrechen. Auf dem Touchscreen kurz gedrückt halten und ziehen.",
          },
          announcements: {
            onDragStart: ({ active }) =>
              `${items.find((round) => round.id === active.id)?.name} aufgenommen.`,
            onDragOver: ({ over }) =>
              over
                ? `Position ${items.findIndex((round) => round.id === over.id) + 1} von ${items.length}.`
                : undefined,
            onDragEnd: ({ over }) =>
              over
                ? `Auf Position ${items.findIndex((round) => round.id === over.id) + 1} abgelegt.`
                : "Verschieben abgebrochen.",
            onDragCancel: () => "Verschieben abgebrochen.",
          },
        }}
      >
        <SortableContext
          items={items.map((round) => round.id!)}
          strategy={verticalListSortingStrategy}
        >
          <ul aria-label="Deine Tipprunden" aria-busy={saving}>
            {items.map((round) => (
              <SortableRound
                key={round.id}
                round={round}
                disabled={saving}
                sortable={items.length > 1}
                reducedMotion={reducedMotion || keyboardDrag}
              />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay
          dropAnimation={reducedMotion || keyboardDrag ? null : { duration: 200, easing }}
        >
          {activeRound ? (
            <div className="sortable-round sortable-round--overlay">
              <div className="sortable-round__link">
                <RoundCopy round={activeRound} />
                <Icon className="round-list__chevron" name="chevron-right" />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <span className="sr-only" role="status">
        {status}
      </span>
      {error && (
        <p className="sortable-rounds__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
