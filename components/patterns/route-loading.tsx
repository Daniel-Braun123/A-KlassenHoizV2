import type { ReactNode } from "react";

type LoadingRegionProps = Readonly<{
  children: ReactNode;
  className?: string;
  label: string;
}>;

function LoadingRegion({ children, className = "", label }: LoadingRegionProps) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className={`route-loading ${className}`.trim()}
      role="status"
    >
      <div aria-hidden="true">{children}</div>
      <span className="sr-only">{label}</span>
    </section>
  );
}

function Bone({ className = "" }: Readonly<{ className?: string }>) {
  return <span className={`loading-bone ${className}`.trim()} />;
}

function IntroSkeleton({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <div className="route-loading__intro">
      <Bone className="loading-bone--eyebrow" />
      <Bone className={compact ? "loading-bone--heading-small" : "loading-bone--heading"} />
      <Bone className="loading-bone--copy" />
    </div>
  );
}

function Panel({
  children,
  className = "",
}: Readonly<{ children: ReactNode; className?: string }>) {
  return <div className={`route-loading__panel ${className}`.trim()}>{children}</div>;
}

function FormFields({ count = 3 }: Readonly<{ count?: number }>) {
  return (
    <div className="route-loading__fields">
      {Array.from({ length: count }, (_, index) => (
        <div className="route-loading__field" key={index}>
          <Bone className="loading-bone--label" />
          <Bone className="loading-bone--control" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: Readonly<{ rows?: number }>) {
  return (
    <div className="route-loading__table">
      <div className="route-loading__table-head">
        <Bone />
        <Bone />
        <Bone />
        <Bone />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div className="route-loading__table-row" key={index}>
          <Bone className="loading-bone--rank" />
          <span className="route-loading__identity">
            <Bone className="loading-bone--avatar" />
            <Bone className="loading-bone--name" />
          </span>
          <Bone className="loading-bone--metric" />
          <Bone className="loading-bone--metric" />
        </div>
      ))}
    </div>
  );
}

export function AuthenticatedPageSkeleton() {
  return (
    <LoadingRegion label="Seite wird geladen">
      <IntroSkeleton />
      <Panel>
        <FormFields count={3} />
      </Panel>
    </LoadingRegion>
  );
}

export function StartPageSkeleton() {
  return (
    <LoadingRegion className="route-loading--start" label="Tipprunden werden geladen">
      <IntroSkeleton />
      <div className="route-loading__section-heading">
        <Bone className="loading-bone--section-title" />
        <Bone className="loading-bone--button-small" />
      </div>
      <div className="route-loading__round-list">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="route-loading__round-row" key={index}>
            <span>
              <Bone className="loading-bone--name" />
              <Bone className="loading-bone--meta" />
            </span>
            <Bone className="loading-bone--chevron" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function NewRoundSkeleton() {
  return (
    <LoadingRegion className="route-loading--form" label="Verfügbare Ligen werden geladen">
      <IntroSkeleton />
      <div className="route-loading__steps">
        {Array.from({ length: 3 }, (_, index) => (
          <span key={index}>
            <Bone className="loading-bone--step-dot" />
            <Bone className="loading-bone--step-label" />
          </span>
        ))}
      </div>
      <Panel>
        <Bone className="loading-bone--section-title" />
        <FormFields count={3} />
        <Bone className="loading-bone--button" />
      </Panel>
    </LoadingRegion>
  );
}

export function RoundOverviewSkeleton() {
  return (
    <LoadingRegion label="Tipprunde wird geladen">
      <IntroSkeleton />
      <Panel className="route-loading__action-panel">
        <Bone className="loading-bone--section-title" />
        <Bone className="loading-bone--copy-short" />
        <Bone className="loading-bone--button" />
      </Panel>
      <div className="route-loading__inline-actions">
        <Bone className="loading-bone--button-small" />
        <Bone className="loading-bone--link" />
      </div>
    </LoadingRegion>
  );
}

function MatchRowSkeleton() {
  return (
    <div className="route-loading__match-row">
      <span className="route-loading__team">
        <Bone className="loading-bone--club-logo" />
        <Bone className="loading-bone--team-name" />
      </span>
      <span className="route-loading__score">
        <Bone className="loading-bone--time" />
        <span>
          <Bone className="loading-bone--score" />
          <Bone className="loading-bone--score-divider" />
          <Bone className="loading-bone--score" />
        </span>
      </span>
      <span className="route-loading__team">
        <Bone className="loading-bone--club-logo" />
        <Bone className="loading-bone--team-name" />
      </span>
    </div>
  );
}

export function PredictionsSkeleton() {
  return (
    <LoadingRegion className="route-loading--predictions" label="Tipps werden geladen">
      <IntroSkeleton compact />
      <div className="route-loading__field">
        <Bone className="loading-bone--label" />
        <Bone className="loading-bone--control" />
      </div>
      <div className="route-loading__matchday">
        <Bone className="loading-bone--date" />
        <Panel className="route-loading__matches">
          {Array.from({ length: 4 }, (_, index) => (
            <MatchRowSkeleton key={index} />
          ))}
        </Panel>
      </div>
      <Bone className="loading-bone--button" />
    </LoadingRegion>
  );
}

export function RankingSkeleton() {
  return (
    <LoadingRegion label="Rangliste wird geladen">
      <IntroSkeleton compact />
      <div className="route-loading__field">
        <Bone className="loading-bone--label" />
        <Bone className="loading-bone--control" />
      </div>
      <div className="route-loading__summary">
        <Bone className="loading-bone--section-title" />
        <Bone className="loading-bone--meta" />
      </div>
      <TableSkeleton rows={5} />
    </LoadingRegion>
  );
}

export function LeagueTableSkeleton() {
  return (
    <LoadingRegion label="Ligatabelle wird geladen">
      <IntroSkeleton compact />
      <div className="route-loading__summary">
        <Bone className="loading-bone--copy-short" />
        <Bone className="loading-bone--meta" />
      </div>
      <TableSkeleton rows={7} />
    </LoadingRegion>
  );
}

export function RoundSettingsSkeleton() {
  return (
    <LoadingRegion className="route-loading--settings" label="Rundeneinstellungen werden geladen">
      <IntroSkeleton />
      <div className="route-loading__panel-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <Panel key={index}>
            <Bone className="loading-bone--section-title" />
            <FormFields count={index === 0 ? 3 : 2} />
          </Panel>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function ProfileSkeleton() {
  return (
    <LoadingRegion className="route-loading--profile" label="Profil wird geladen">
      <IntroSkeleton />
      <div className="route-loading__profile-sections">
        {Array.from({ length: 3 }, (_, index) => (
          <Panel key={index}>
            <div className="route-loading__section-heading">
              <span>
                <Bone className="loading-bone--section-title" />
                <Bone className="loading-bone--copy" />
              </span>
              {index > 0 ? <Bone className="loading-bone--button-small" /> : null}
            </div>
          </Panel>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function AdminListSkeleton({
  label = "Verwaltungsdaten werden geladen",
  showLogo = false,
}: Readonly<{ label?: string; showLogo?: boolean }>) {
  return (
    <LoadingRegion className="route-loading--admin-list" label={label}>
      <div className="route-loading__section-heading">
        <Bone className="loading-bone--heading-small" />
        <Bone className="loading-bone--button-small" />
      </div>
      <div className="route-loading__admin-list">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="route-loading__admin-row" key={index}>
            {showLogo ? <Bone className="loading-bone--club-logo" /> : null}
            <span>
              <Bone className="loading-bone--name" />
              <Bone className="loading-bone--meta" />
            </span>
            <Bone className="loading-bone--status" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

export function LeagueOverviewSkeleton() {
  return (
    <LoadingRegion className="route-loading--form" label="Ligadaten werden geladen">
      <Bone className="loading-bone--heading-small" />
      <Panel>
        <FormFields count={3} />
        <div className="route-loading__choice-list">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone className="loading-bone--choice" key={index} />
          ))}
        </div>
        <Bone className="loading-bone--button" />
      </Panel>
    </LoadingRegion>
  );
}

export function ScheduleSkeleton() {
  return (
    <LoadingRegion className="route-loading--schedule" label="Spielplan wird geladen">
      <Bone className="loading-bone--heading-small" />
      <div className="route-loading__schedule-grid">
        <Panel className="route-loading__schedule-nav">
          <Bone className="loading-bone--section-title" />
          <Bone className="loading-bone--control" />
          <Bone className="loading-bone--button" />
        </Panel>
        <Panel>
          <div className="route-loading__section-heading">
            <span>
              <Bone className="loading-bone--section-title" />
              <Bone className="loading-bone--meta" />
            </span>
            <Bone className="loading-bone--icon-button" />
          </div>
          <div className="route-loading__matches">
            {Array.from({ length: 4 }, (_, index) => (
              <MatchRowSkeleton key={index} />
            ))}
          </div>
        </Panel>
      </div>
    </LoadingRegion>
  );
}

export function ResultsSkeleton() {
  return (
    <LoadingRegion className="route-loading--results" label="Ergebnisse werden geladen">
      <Bone className="loading-bone--heading-small" />
      <Bone className="loading-bone--control" />
      <Panel className="route-loading__matches">
        {Array.from({ length: 5 }, (_, index) => (
          <MatchRowSkeleton key={index} />
        ))}
      </Panel>
      <Bone className="loading-bone--button" />
    </LoadingRegion>
  );
}
