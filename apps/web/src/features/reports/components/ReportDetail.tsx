import type { ReactElement } from "react";
import type { ReportDetail } from "@gapdown-radar/contracts";
import { useState } from "react";

type ReportDetailProps = {
  readonly report: ReportDetail;
  readonly loading: boolean;
};

const isExternalUrl = (value: string): boolean => {
  return value.startsWith("https://") || value.startsWith("http://");
};

const renderRiskTone = (value: number): string => {
  if (value >= 75) {
    return "elevated";
  }

  if (value >= 50) {
    return "active";
  }

  return "contained";
};

const formatLabel = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
};

export const ReportDetailView = ({ report, loading }: ReportDetailProps): ReactElement => {
  const [activeView, setActiveView] = useState<"trade" | "research" | "sources">("trade");

  return (
    <section className="panel detail">
      <div className="detail-hero">
        <div className="detail-kicker-row">
          <div className="eyebrow">Report Detail</div>
          <span className="pill tabular">-{report.dropPct.toFixed(1)}%</span>
        </div>
        <h2>{report.headline}</h2>
        <p className="detail-deck">{report.executiveSummary}</p>
        <div className="detail-tab-row" role="tablist" aria-label="Report views">
          <button
            aria-selected={activeView === "trade"}
            className={`detail-tab${activeView === "trade" ? " active" : ""}`}
            onClick={() => setActiveView("trade")}
            role="tab"
            type="button"
          >
            Trade Desk
          </button>
          <button
            aria-selected={activeView === "research"}
            className={`detail-tab${activeView === "research" ? " active" : ""}`}
            onClick={() => setActiveView("research")}
            role="tab"
            type="button"
          >
            Research
          </button>
          <button
            aria-selected={activeView === "sources"}
            className={`detail-tab${activeView === "sources" ? " active" : ""}`}
            onClick={() => setActiveView("sources")}
            role="tab"
            type="button"
          >
            Evidence
          </button>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric-card metric-span-2">
          <div className="eyebrow">Company</div>
          <strong>
            {report.companyName} ({report.ticker})
          </strong>
        </div>
        <div className="metric-card metric-span-2">
          <div className="eyebrow">Primary Cause</div>
          <strong>{formatLabel(report.primaryCause)}</strong>
        </div>
        <div className="metric-card">
          <div className="eyebrow">Drop Day</div>
          <strong className="tabular">
            {report.eventDate} / -{report.dropPct.toFixed(1)}%
          </strong>
        </div>
        <div className="metric-card">
          <div className="eyebrow">Quality</div>
          <strong className="tabular">{loading ? "Refreshing" : report.quality.totalScore}</strong>
        </div>
        <div className="metric-card metric-span-2">
          <div className="eyebrow">Snapshot</div>
          <strong>{report.snapshot.snapshotId}</strong>
        </div>
        <div className="metric-card metric-span-2">
          <div className="eyebrow">Generated</div>
          <strong className="tabular">
            {new Date(report.snapshot.createdAt).toLocaleString()}
          </strong>
        </div>
      </div>
      {activeView === "trade" ? (
        <>
          <div className="grid-2 trade-priority-grid">
            <section className="section info-card trade-hero-card">
              <div className="section-heading compact-heading">
                <div className="eyebrow">Trade View</div>
                <h3>{report.tradeRecommendation.label}</h3>
              </div>
              <div className="trade-banner-row">
                <span className="cause-tag">
                  {formatLabel(report.tradeRecommendation.direction)}
                </span>
                <span className="similarity-pill">
                  {formatLabel(report.tradeRecommendation.conviction)}
                </span>
              </div>
              <p>{report.tradeRecommendation.thesis}</p>
              <div className="trade-grid">
                <div>
                  <div className="eyebrow">Entry Trigger</div>
                  <p>{report.tradeRecommendation.entryTrigger}</p>
                </div>
                <div>
                  <div className="eyebrow">Stop Trigger</div>
                  <p>{report.tradeRecommendation.stopTrigger}</p>
                </div>
                <div>
                  <div className="eyebrow">Target View</div>
                  <p>{report.tradeRecommendation.targetView}</p>
                </div>
                <div>
                  <div className="eyebrow">Sizing</div>
                  <p>{report.tradeRecommendation.sizingView}</p>
                </div>
              </div>
            </section>
            <section className="section info-card">
              <div className="section-heading compact-heading">
                <div className="eyebrow">Risk Dashboard</div>
                <h3>Structured stress view</h3>
              </div>
              <div className="risk-grid">
                <article className="risk-cell risk-cell-emphasis">
                  <span className="eyebrow">Overall</span>
                  <strong className="tabular">{report.riskDashboard.overallRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.overallRisk)}</span>
                </article>
                <article className="risk-cell">
                  <span className="eyebrow">Balance Sheet</span>
                  <strong className="tabular">{report.riskDashboard.balanceSheetRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.balanceSheetRisk)}</span>
                </article>
                <article className="risk-cell">
                  <span className="eyebrow">Earnings</span>
                  <strong className="tabular">{report.riskDashboard.earningsRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.earningsRisk)}</span>
                </article>
                <article className="risk-cell">
                  <span className="eyebrow">Demand</span>
                  <strong className="tabular">{report.riskDashboard.demandRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.demandRisk)}</span>
                </article>
                <article className="risk-cell">
                  <span className="eyebrow">Dilution</span>
                  <strong className="tabular">{report.riskDashboard.dilutionRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.dilutionRisk)}</span>
                </article>
                <article className="risk-cell">
                  <span className="eyebrow">Timing</span>
                  <strong className="tabular">{report.riskDashboard.timingRisk}</strong>
                  <span>{renderRiskTone(report.riskDashboard.timingRisk)}</span>
                </article>
              </div>
            </section>
          </div>
          <div className="grid-2">
            <section className="section info-card">
              <div className="section-heading compact-heading">
                <div className="eyebrow">Catalysts</div>
                <h3>Near-term triggers</h3>
              </div>
              <div className="timeline-list">
                {report.catalysts.map((catalyst) => (
                  <article className="timeline-item" key={`${catalyst.date}-${catalyst.title}`}>
                    <div className="timeline-top">
                      <span className="tabular">{catalyst.date}</span>
                      <span className="cause-tag">{formatLabel(catalyst.significance)}</span>
                    </div>
                    <strong>{catalyst.title}</strong>
                    <p>{catalyst.rationale}</p>
                  </article>
                ))}
              </div>
            </section>
            <section className="section info-card">
              <div className="section-heading compact-heading">
                <div className="eyebrow">Peer Comparison</div>
                <h3>Broken versus watched names</h3>
              </div>
              <div className="comparison-table">
                <div className="comparison-row comparison-head">
                  <span>Ticker</span>
                  <span>Status</span>
                  <span>Drop</span>
                  <span>Similarity</span>
                </div>
                {report.peerComparison.map((peer) => (
                  <div className="comparison-row" key={`${peer.ticker}-${peer.status}`}>
                    <div>
                      <strong>{peer.ticker}</strong>
                      <div className="company-inline">{peer.companyName}</div>
                    </div>
                    <span className="cause-tag">{formatLabel(peer.status)}</span>
                    <span className="tabular">
                      {peer.status === "watch" ? "--" : `${peer.dropPct.toFixed(1)}%`}
                    </span>
                    <span className="tabular">{peer.similarityScore}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
      {activeView === "research" ? (
        <>
          <div className="detail-stack">
            <section className="section narrative-card">
              <h3>Thesis</h3>
              <p>{report.thesis}</p>
            </section>
            <section className="section narrative-card">
              <h3>Historical Pattern</h3>
              <p>{report.historicalPattern}</p>
            </section>
          </div>
          <div className="grid-2">
            <section className="section info-card">
              <h3>Key Signals</h3>
              <ul className="signal-list">
                {report.keySignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </section>
            <section className="section info-card">
              <h3>Risk Factors</h3>
              <ul className="signal-list">
                {report.riskFactors.map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            </section>
          </div>
          <section className="section info-card">
            <div className="section-heading compact-heading">
              <div className="eyebrow">Peer View</div>
              <h3>Undropped Watchlist</h3>
            </div>
            <div className="watch-grid">
              {report.watchlist.map((candidate) => (
                <article className="watch-card" key={candidate.ticker}>
                  <div className="watch-header">
                    <div>
                      <strong>{candidate.ticker}</strong>
                      <div className="company-inline">{candidate.companyName}</div>
                    </div>
                    <span className="similarity-pill tabular">{candidate.similarityScore}</span>
                  </div>
                  <p>{candidate.riskSummary}</p>
                  <ul className="signal-list compact-list">
                    {candidate.sharedSignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
          <section className="section info-card">
            <div className="section-heading compact-heading">
              <div className="eyebrow">Evidence Timeline</div>
              <h3>Sequence of the break</h3>
            </div>
            <div className="timeline-list">
              {report.evidenceTimeline.map((item) => (
                <article className="timeline-item" key={`${item.date}-${item.title}`}>
                  <div className="timeline-top">
                    <span className="tabular">{item.date}</span>
                    <span className="cause-tag">{formatLabel(item.kind)}</span>
                  </div>
                  {isExternalUrl(item.url) ? (
                    <a className="citation-link" href={item.url} rel="noreferrer" target="_blank">
                      {item.title}
                    </a>
                  ) : (
                    <strong>{item.title}</strong>
                  )}
                  <p>{item.takeaway}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
      {activeView === "sources" ? (
        <section className="section info-card">
          <div className="section-heading compact-heading">
            <div className="eyebrow">Source Trail</div>
            <h3>Citations</h3>
          </div>
          <div className="citation-grid">
            {report.citations.map((citation) => (
              <article className="citation" key={citation.id}>
                <div className="citation-top">
                  <div>
                    {isExternalUrl(citation.url) ? (
                      <a
                        className="citation-link"
                        href={citation.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {citation.title}
                      </a>
                    ) : (
                      <strong>{citation.title}</strong>
                    )}
                    <div className="tabular citation-date">{citation.date}</div>
                  </div>
                  <span className="cause-tag">{formatLabel(citation.kind)}</span>
                </div>
                <p>{citation.excerpt}</p>
                {isExternalUrl(citation.url) ? (
                  <a
                    className="citation-source"
                    href={citation.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open source document
                  </a>
                ) : (
                  <span className="citation-source muted-source">Local fixture source</span>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
};
