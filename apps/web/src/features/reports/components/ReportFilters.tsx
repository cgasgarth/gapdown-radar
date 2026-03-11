import type { ReactElement } from "react";
import type { ReportQuery } from "@gapdown-radar/contracts";
import { useEffect, useState } from "react";

type ReportFiltersProps = {
  readonly query: ReportQuery;
  readonly onApply: (query: ReportQuery) => void;
};

export const ReportFilters = ({ query, onApply }: ReportFiltersProps): ReactElement => {
  const [draft, setDraft] = useState<ReportQuery>(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  return (
    <section className="panel filters">
      <div className="section-heading">
        <div className="eyebrow">Analysis Window</div>
        <h3>Two-year event scan</h3>
        <p>Define the break threshold and scan window for the current local run.</p>
      </div>
      <div className="filters-grid">
        <div className="field field-span-2">
          <label htmlFor="seed-ticker">Seed ticker</label>
          <input
            id="seed-ticker"
            maxLength={10}
            placeholder="EMAT"
            type="text"
            value={draft.seedTicker ?? ""}
            onChange={(event) => {
              const nextValue = event.currentTarget.value.trim().toUpperCase();

              setDraft((current) => {
                if (nextValue.length === 0) {
                  const nextDraft = { ...current };

                  delete nextDraft.seedTicker;

                  return nextDraft;
                }

                return { ...current, seedTicker: nextValue };
              });
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="start-date">Start date</label>
          <input
            id="start-date"
            type="date"
            value={draft.startDate}
            onChange={(event) =>
              setDraft((current) => ({ ...current, startDate: event.currentTarget.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="end-date">End date</label>
          <input
            id="end-date"
            type="date"
            value={draft.endDate}
            onChange={(event) =>
              setDraft((current) => ({ ...current, endDate: event.currentTarget.value }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="minimum-drop">Minimum drop %</label>
          <input
            id="minimum-drop"
            type="number"
            min={10}
            max={60}
            value={draft.minimumDropPct}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                minimumDropPct: Number(event.currentTarget.value),
              }))
            }
          />
        </div>
        <div className="field">
          <label htmlFor="max-reports">Report cap</label>
          <input
            id="max-reports"
            type="number"
            min={1}
            max={25}
            value={draft.maxReports}
            onChange={(event) =>
              setDraft((current) => ({ ...current, maxReports: Number(event.currentTarget.value) }))
            }
          />
        </div>
      </div>
      <div className="filters-footer">
        <div className="filter-chip-row">
          {draft.seedTicker === undefined ? null : (
            <span className="cause-tag">Seed {draft.seedTicker}</span>
          )}
          <span className="cause-tag">Min {draft.minimumDropPct}%</span>
          <span className="cause-tag">Cap {draft.maxReports}</span>
        </div>
        <button className="button" onClick={() => onApply(draft)} type="button">
          Refresh Reports
        </button>
      </div>
    </section>
  );
};
