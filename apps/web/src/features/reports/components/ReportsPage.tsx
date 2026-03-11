import type { ReactElement } from "react";

import { ReportFilters } from "./ReportFilters";
import { ReportDetailView } from "./ReportDetail";
import { ReportList } from "./ReportList";
import { SnapshotPanel } from "./SnapshotPanel";
import { UniversePanel } from "./UniversePanel";
import { useReports } from "../hooks/useReports";

export const ReportsPage = (): ReactElement => {
  const {
    collection,
    detailLoading,
    error,
    loading,
    query,
    createSavedUniverse,
    deleteSavedUniverse,
    selectReportId,
    selectSnapshotId,
    selectUniverseId,
    selectedReport,
    selectedReportId,
    selectedSnapshotId,
    selectedUniverse,
    snapshots,
    updateQuery,
    universes,
  } = useReports();

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">GapDown Radar</div>
          <h1>Find the break. Explain the cause. Surface the next weak stack.</h1>
          <p>
            This local research desk scans two years of one-day drawdowns, scores the underlying
            evidence, highlights undropped peers with materially similar stress factors, and can run
            on free public-market data.
          </p>
        </div>
        <div className="hero-strip">
          <article className="hero-stat">
            <span className="eyebrow">Mode</span>
            <strong>{collection?.dataMode ?? "fixture"}</strong>
          </article>
          <article className="hero-stat">
            <span className="eyebrow">Reports</span>
            <strong>{collection?.reports.length ?? 0}</strong>
          </article>
          <article className="hero-stat">
            <span className="eyebrow">Window</span>
            <strong>
              {query.startDate} to {query.endDate}
            </strong>
          </article>
          <article className="hero-stat hero-stat-wide">
            <span className="eyebrow">Latest Snapshot</span>
            <strong>{collection?.snapshot.snapshotId ?? "Waiting for first run"}</strong>
          </article>
        </div>
      </section>
      <div className="workspace-grid">
        <aside className="sidebar-stack">
          <ReportFilters onApply={updateQuery} query={query} />
          {loading ? (
            <div className="status">Loading report list...</div>
          ) : collection === null ? null : (
            <ReportList
              onSelect={selectReportId}
              reports={collection.reports}
              selectedReportId={selectedReportId}
            />
          )}
          <UniversePanel
            onCreateUniverse={createSavedUniverse}
            onDeleteUniverse={deleteSavedUniverse}
            onSelectUniverseId={selectUniverseId}
            selectedUniverse={selectedUniverse}
            universes={universes}
          />
          <SnapshotPanel
            currentSnapshot={collection?.snapshot ?? null}
            onSelectSnapshot={selectSnapshotId}
            selectedSnapshotId={selectedSnapshotId}
            snapshots={snapshots}
          />
        </aside>
        <section className="detail-column">
          {error === null ? null : <div className="error">{error}</div>}
          {selectedReport === null ? (
            <div className="status">Select a report to inspect the full evidence stack.</div>
          ) : (
            <ReportDetailView loading={detailLoading} report={selectedReport} />
          )}
        </section>
      </div>
    </main>
  );
};
