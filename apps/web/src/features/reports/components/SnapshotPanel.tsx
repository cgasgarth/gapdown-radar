import type { ReactElement } from "react";
import type { SnapshotList, SnapshotMetadata } from "@gapdown-radar/contracts";

type SnapshotPanelProps = {
  readonly currentSnapshot: SnapshotMetadata | null;
  readonly selectedSnapshotId: string | null;
  readonly snapshots: SnapshotList | null;
  readonly onSelectSnapshot: (snapshotId: string | null) => void;
};

const renderTimestamp = (value: string): string => {
  return new Date(value).toLocaleString();
};

export const SnapshotPanel = ({
  currentSnapshot,
  selectedSnapshotId,
  snapshots,
  onSelectSnapshot,
}: SnapshotPanelProps): ReactElement | null => {
  if (currentSnapshot === null && snapshots === null) {
    return null;
  }

  return (
    <section className="panel snapshot-panel">
      <div className="section-heading">
        <div className="eyebrow">Snapshots</div>
        <h3>Local report archive</h3>
        <p>Jump between the current run and prior locally archived report batches.</p>
      </div>
      <button className="snapshot-action" onClick={() => onSelectSnapshot(null)} type="button">
        Current query run
      </button>
      {currentSnapshot === null ? null : (
        <article
          className={`snapshot-card${selectedSnapshotId === null ? " current-snapshot" : ""}`}
        >
          <strong>{currentSnapshot.snapshotId}</strong>
          <div className="tabular">{renderTimestamp(currentSnapshot.createdAt)}</div>
          <div className="snapshot-meta">
            {currentSnapshot.dataMode} / {currentSnapshot.reportCount} reports
          </div>
        </article>
      )}
      <div className="snapshot-list">
        {(snapshots?.snapshots ?? []).slice(0, 4).map((snapshot) => (
          <button
            className={`snapshot-card${selectedSnapshotId === snapshot.snapshotId ? " current-snapshot" : ""}`}
            key={snapshot.snapshotId}
            onClick={() => onSelectSnapshot(snapshot.snapshotId)}
            type="button"
          >
            <strong>{snapshot.snapshotId}</strong>
            <div className="tabular">{renderTimestamp(snapshot.createdAt)}</div>
            <div className="snapshot-meta">
              {snapshot.dataMode} / {snapshot.reportCount} reports
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
