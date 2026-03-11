import type { ReactElement } from "react";
import type { ReportSummary } from "@gapdown-radar/contracts";

const formatLabel = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
};

type ReportListProps = {
  readonly reports: readonly ReportSummary[];
  readonly selectedReportId: string | null;
  readonly onSelect: (reportId: string) => void;
};

export const ReportList = ({
  reports,
  selectedReportId,
  onSelect,
}: ReportListProps): ReactElement => {
  return (
    <section className="panel list">
      <div className="section-heading">
        <div className="eyebrow">Reports</div>
        <h3>Breakbook</h3>
        <p>{reports.length} ranked names with validated quality gates and supporting evidence.</p>
      </div>
      {reports.map((report) => {
        const isActive = selectedReportId === report.reportId;

        return (
          <button
            key={report.reportId}
            className={`list-card${isActive ? " active" : ""}`}
            onClick={() => onSelect(report.reportId)}
            type="button"
          >
            <div className="list-card-top">
              <span className="ticker-lockup">
                <span className="ticker">{report.ticker}</span>
                <span className="company-inline">{report.companyName}</span>
              </span>
              <div className="list-metric-stack">
                <span className="list-quality tabular">Q{report.quality.totalScore}</span>
                <span className="pill tabular">-{report.dropPct.toFixed(1)}%</span>
              </div>
            </div>
            <div className="meta-row">
              <span className="tabular">{report.eventDate}</span>
              <span className="cause-tag">{formatLabel(report.primaryCause)}</span>
            </div>
            <div className="headline-snippet">{report.headline}</div>
            <div className="score-row">
              <span className="sector-line">{report.sector}</span>
              <span className="company-inline">Trade setup</span>
            </div>
          </button>
        );
      })}
    </section>
  );
};
