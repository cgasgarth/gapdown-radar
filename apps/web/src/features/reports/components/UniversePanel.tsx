import type {
  CreateSavedUniverseInput,
  SavedUniverse,
  SavedUniverseList,
} from "@gapdown-radar/contracts";
import type { ReactElement } from "react";
import { useState } from "react";

type UniversePanelProps = {
  readonly universes: SavedUniverseList | null;
  readonly selectedUniverse: SavedUniverse | null;
  readonly onSelectUniverseId: (universeId: string | null) => void;
  readonly onCreateUniverse: (input: CreateSavedUniverseInput) => Promise<void>;
  readonly onDeleteUniverse: (universeId: string) => Promise<void>;
};

type UniverseDraft = {
  readonly name: string;
  readonly kind: "universe" | "watchlist";
  readonly tickers: string;
  readonly note: string;
};

const defaultDraft: UniverseDraft = {
  name: "",
  kind: "universe",
  tickers: "",
  note: "",
};

const parseTickers = (value: string): Array<string> => {
  return value
    .split(",")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter((ticker) => ticker.length > 0);
};

export const UniversePanel = ({
  universes,
  selectedUniverse,
  onSelectUniverseId,
  onCreateUniverse,
  onDeleteUniverse,
}: UniversePanelProps): ReactElement => {
  const [draft, setDraft] = useState<UniverseDraft>(defaultDraft);
  const parsedTickers = parseTickers(draft.tickers);
  const canSave = draft.name.trim().length > 0 && parsedTickers.length > 0;

  return (
    <section className="panel universe-panel">
      <div className="section-heading">
        <div className="eyebrow">Saved Universes</div>
        <h3>SQLite watchlists</h3>
        <p>Save reusable ticker baskets locally and run the scanner against them.</p>
      </div>
      <div className="field">
        <label htmlFor="universe-select">Active universe</label>
        <select
          id="universe-select"
          value={selectedUniverse?.id ?? ""}
          onChange={(event) => {
            const value = event.currentTarget.value;

            onSelectUniverseId(value.length === 0 ? null : value);
          }}
        >
          <option value="">Default universe</option>
          {(universes?.universes ?? []).map((universe) => (
            <option key={universe.id} value={universe.id}>
              {universe.name}
            </option>
          ))}
        </select>
      </div>
      {selectedUniverse === null ? null : (
        <article className="universe-card current-snapshot">
          <div className="ticker-row">
            <strong>{selectedUniverse.name}</strong>
            <button
              className="text-action"
              onClick={() => void onDeleteUniverse(selectedUniverse.id)}
              type="button"
            >
              Delete
            </button>
          </div>
          <div className="snapshot-meta">{selectedUniverse.kind}</div>
          <div className="universe-ticker-list">{selectedUniverse.tickers.join(", ")}</div>
        </article>
      )}
      <div className="universe-form-grid">
        <div className="field field-span-2">
          <label htmlFor="universe-name">Name</label>
          <input
            id="universe-name"
            placeholder="Solar stress basket"
            type="text"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="universe-kind">Kind</label>
          <select
            id="universe-kind"
            value={draft.kind}
            onChange={(event) =>
              setDraft({
                ...draft,
                kind: event.currentTarget.value === "watchlist" ? "watchlist" : "universe",
              })
            }
          >
            <option value="universe">Universe</option>
            <option value="watchlist">Watchlist</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="universe-note">Note</label>
          <input
            id="universe-note"
            placeholder="Free-data peer basket"
            type="text"
            value={draft.note}
            onChange={(event) => setDraft({ ...draft, note: event.currentTarget.value })}
          />
        </div>
        <div className="field field-span-2">
          <label htmlFor="universe-tickers">Tickers</label>
          <input
            id="universe-tickers"
            placeholder="EMAT,PLUG,RUN,ARRY,SEDG,ENPH"
            type="text"
            value={draft.tickers}
            onChange={(event) => setDraft({ ...draft, tickers: event.currentTarget.value })}
          />
        </div>
      </div>
      <button
        className="button"
        disabled={!canSave}
        onClick={() => {
          void onCreateUniverse({
            name: draft.name,
            kind: draft.kind,
            tickers: parsedTickers,
            ...(draft.note.trim().length === 0 ? {} : { note: draft.note.trim() }),
          }).then(() => setDraft(defaultDraft));
        }}
        type="button"
      >
        Save Universe
      </button>
      <div className="helper-copy">
        Save focused baskets here, then pair them with a seed ticker to surface cleaner trade
        setups.
      </div>
      <div className="universe-list">
        {(universes?.universes ?? []).slice(0, 5).map((universe) => (
          <article className="universe-card" key={universe.id}>
            <div className="ticker-row">
              <strong>{universe.name}</strong>
              <span className="cause-tag">{universe.kind}</span>
            </div>
            <div className="universe-ticker-list">{universe.tickers.join(", ")}</div>
          </article>
        ))}
      </div>
    </section>
  );
};
