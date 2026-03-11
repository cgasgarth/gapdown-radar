/// <reference path="../../bun-sqlite.d.ts" />

import { Database } from "bun:sqlite";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

import {
  CreateSavedUniverseInputSchema,
  SavedUniverseListSchema,
  SavedUniverseSchema,
  type CreateSavedUniverseInput,
  type SavedUniverse,
  type SavedUniverseList,
} from "@gapdown-radar/contracts";

type UniverseRow = {
  readonly id: string;
  readonly name: string;
  readonly kind: "universe" | "watchlist";
  readonly tickers_json: string;
  readonly note: string | null;
  readonly created_at: string;
  readonly updated_at: string;
};

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(currentDirectory, "../../../../data/gapdown-radar.sqlite");

const normalizeTickers = (tickers: ReadonlyArray<string>): Array<string> => {
  return [
    ...new Set(
      tickers.map((ticker) => ticker.trim().toUpperCase()).filter((ticker) => ticker.length > 0),
    ),
  ];
};

const mapUniverseRow = (row: UniverseRow): SavedUniverse => {
  return SavedUniverseSchema.parse({
    id: row.id,
    name: row.name,
    kind: row.kind,
    tickers: normalizeTickers(JSON.parse(row.tickers_json) as Array<string>),
    ...(row.note === null ? {} : { note: row.note }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export interface UniverseStore {
  listUniverses(): SavedUniverseList;
  getUniverse(id: string): SavedUniverse | null;
  createUniverse(input: CreateSavedUniverseInput): SavedUniverse;
  deleteUniverse(id: string): boolean;
}

export class SqliteUniverseStore implements UniverseStore {
  readonly #database: Database;

  public constructor() {
    mkdirSync(path.dirname(databasePath), { recursive: true });
    this.#database = new Database(databasePath, { create: true });
    this.#database.run(
      "CREATE TABLE IF NOT EXISTS saved_universes (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, tickers_json TEXT NOT NULL, note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
  }

  public listUniverses(): SavedUniverseList {
    const rows: Array<UniverseRow> = this.#database
      .query<UniverseRow>(
        "SELECT id, name, kind, tickers_json, note, created_at, updated_at FROM saved_universes ORDER BY updated_at DESC",
      )
      .all();

    return SavedUniverseListSchema.parse({
      generatedAt: new Date().toISOString(),
      universes: rows.map((row) => mapUniverseRow(row)),
    });
  }

  public getUniverse(id: string): SavedUniverse | null {
    const row = this.#database
      .query<UniverseRow>(
        "SELECT id, name, kind, tickers_json, note, created_at, updated_at FROM saved_universes WHERE id = ?1",
      )
      .get(id);

    if (row === null) {
      return null;
    }

    return mapUniverseRow(row);
  }

  public createUniverse(input: CreateSavedUniverseInput): SavedUniverse {
    const parsed = CreateSavedUniverseInputSchema.parse({
      ...input,
      tickers: normalizeTickers(input.tickers),
    });
    const timestamp = new Date().toISOString();
    const universe = SavedUniverseSchema.parse({
      id: randomUUID(),
      name: parsed.name,
      kind: parsed.kind,
      tickers: parsed.tickers,
      ...(parsed.note === undefined ? {} : { note: parsed.note }),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    this.#database.run(
      "INSERT INTO saved_universes (id, name, kind, tickers_json, note, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      [
        universe.id,
        universe.name,
        universe.kind,
        JSON.stringify(universe.tickers),
        universe.note ?? null,
        universe.createdAt,
        universe.updatedAt,
      ],
    );

    return universe;
  }

  public deleteUniverse(id: string): boolean {
    const existing = this.getUniverse(id);

    if (existing === null) {
      return false;
    }

    this.#database.run("DELETE FROM saved_universes WHERE id = ?1", [id]);
    return true;
  }
}
