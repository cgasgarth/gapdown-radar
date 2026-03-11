import {
  buildDefaultReportQuery,
  type CreateSavedUniverseInput,
  type ReportCollection,
  type ReportDetail,
  type ReportQuery,
  type SavedUniverse,
  type SavedUniverseList,
  type SnapshotList,
} from "@gapdown-radar/contracts";
import { useEffect, useMemo, useState } from "react";

import {
  createUniverse,
  deleteUniverse,
  fetchReportCollection,
  fetchReportDetail,
  fetchSnapshotCollection,
  fetchSnapshotList,
  fetchSnapshotReport,
  fetchUniverseList,
} from "../lib/api-client";

type ReportsState = {
  readonly query: ReportQuery;
  readonly collection: ReportCollection | null;
  readonly selectedReportId: string | null;
  readonly selectedReport: ReportDetail | null;
  readonly selectedSnapshotId: string | null;
  readonly snapshots: SnapshotList | null;
  readonly universes: SavedUniverseList | null;
  readonly selectedUniverse: SavedUniverse | null;
  readonly loading: boolean;
  readonly detailLoading: boolean;
  readonly error: string | null;
  readonly updateQuery: (nextQuery: ReportQuery) => void;
  readonly selectReportId: (reportId: string) => void;
  readonly selectSnapshotId: (snapshotId: string | null) => void;
  readonly selectUniverseId: (universeId: string | null) => void;
  readonly createSavedUniverse: (input: CreateSavedUniverseInput) => Promise<void>;
  readonly deleteSavedUniverse: (universeId: string) => Promise<void>;
};

const withoutUniverseId = (query: ReportQuery): ReportQuery => {
  const rest = { ...query };

  delete rest.universeId;

  return rest;
};

export const useReports = (): ReportsState => {
  const [query, setQuery] = useState<ReportQuery>(() => buildDefaultReportQuery(new Date()));
  const [collection, setCollection] = useState<ReportCollection | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotList | null>(null);
  const [universes, setUniverses] = useState<SavedUniverseList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUniverses = async (): Promise<void> => {
      try {
        setUniverses(await fetchUniverseList());
      } catch (errorValue) {
        setError(errorValue instanceof Error ? errorValue.message : "Unable to load universes.");
      }
    };

    void loadUniverses();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadCollection = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const [nextCollection, nextSnapshots] = await Promise.all([
          selectedSnapshotId === null
            ? fetchReportCollection(query)
            : fetchSnapshotCollection(selectedSnapshotId),
          fetchSnapshotList(),
        ]);

        if (controller.signal.aborted === true) {
          return;
        }

        setCollection(nextCollection);
        setSnapshots(nextSnapshots);
        setSelectedReportId((current) => {
          if (
            current !== null &&
            nextCollection.reports.some((report) => report.reportId === current)
          ) {
            return current;
          }

          return nextCollection.reports[0]?.reportId ?? null;
        });
      } catch (errorValue) {
        if (controller.signal.aborted === true) {
          return;
        }

        setError(errorValue instanceof Error ? errorValue.message : "Unable to load reports.");
      } finally {
        if (controller.signal.aborted === false) {
          setLoading(false);
        }
      }
    };

    void loadCollection();

    return (): void => {
      controller.abort();
    };
  }, [query, selectedSnapshotId]);

  useEffect(() => {
    if (selectedReportId === null) {
      setSelectedReport(null);
      return;
    }

    const controller = new AbortController();

    const loadDetail = async (): Promise<void> => {
      try {
        setDetailLoading(true);
        const detail =
          selectedSnapshotId === null
            ? await fetchReportDetail(selectedReportId, query)
            : await fetchSnapshotReport(selectedSnapshotId, selectedReportId);

        if (controller.signal.aborted === true) {
          return;
        }

        setSelectedReport(detail);
      } catch (errorValue) {
        if (controller.signal.aborted === true) {
          return;
        }

        setError(
          errorValue instanceof Error ? errorValue.message : "Unable to load report detail.",
        );
      } finally {
        if (controller.signal.aborted === false) {
          setDetailLoading(false);
        }
      }
    };

    void loadDetail();

    return (): void => {
      controller.abort();
    };
  }, [query, selectedReportId, selectedSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId !== null) {
      return;
    }

    setError(null);
    setSelectedReportId(null);
  }, [query, selectedSnapshotId]);

  const selectedUniverse =
    query.universeId === undefined
      ? null
      : (universes?.universes.find((universe) => universe.id === query.universeId) ?? null);

  return useMemo(
    () => ({
      query,
      collection,
      selectedReportId,
      selectedReport,
      selectedSnapshotId,
      snapshots,
      universes,
      selectedUniverse,
      loading,
      detailLoading,
      error,
      updateQuery: (nextQuery: ReportQuery): void => {
        setError(null);
        setSelectedReport(null);
        setSelectedSnapshotId(null);
        setSelectedReportId(null);
        setQuery(nextQuery);
      },
      selectReportId: (reportId: string): void => {
        setError(null);
        setSelectedReportId(reportId);
      },
      selectSnapshotId: (snapshotId: string | null): void => {
        setError(null);
        setSelectedReport(null);
        setSelectedReportId(null);
        setSelectedSnapshotId(snapshotId);
      },
      selectUniverseId: (universeId: string | null): void => {
        setError(null);
        setSelectedReport(null);
        setSelectedReportId(null);
        setSelectedSnapshotId(null);
        setQuery((current) => {
          if (universeId === null) {
            return withoutUniverseId(current);
          }

          return { ...current, universeId };
        });
      },
      createSavedUniverse: async (input: CreateSavedUniverseInput): Promise<void> => {
        const created = await createUniverse(input);

        setUniverses(await fetchUniverseList());
        setError(null);
        setSelectedReport(null);
        setSelectedReportId(null);
        setSelectedSnapshotId(null);
        setQuery((current) => ({ ...current, universeId: created.id }));
      },
      deleteSavedUniverse: async (universeId: string): Promise<void> => {
        await deleteUniverse(universeId);

        setUniverses(await fetchUniverseList());
        setError(null);
        setSelectedReport(null);
        setSelectedReportId(null);
        setSelectedSnapshotId(null);
        setQuery((current) => {
          if (current.universeId !== universeId) {
            return current;
          }

          return withoutUniverseId(current);
        });
      },
    }),
    [
      collection,
      detailLoading,
      error,
      loading,
      query,
      selectedUniverse,
      selectedReport,
      selectedReportId,
      selectedSnapshotId,
      snapshots,
      universes,
    ],
  );
};
