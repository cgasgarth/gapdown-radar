import {
  ApiErrorSchema,
  CreateSavedUniverseInputSchema,
  ReportCollectionSchema,
  ReportDetailSchema,
  SavedUniverseListSchema,
  SavedUniverseSchema,
  SnapshotListSchema,
  type CreateSavedUniverseInput,
  type ReportCollection,
  type ReportDetail,
  type ReportQuery,
  type SavedUniverse,
  type SavedUniverseList,
  type SnapshotList,
} from "@gapdown-radar/contracts";

const buildSearchParameters = (query: ReportQuery): string => {
  return new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
    minimumDropPct: String(query.minimumDropPct),
    maxReports: String(query.maxReports),
    ...(query.seedTicker === undefined ? {} : { seedTicker: query.seedTicker }),
    ...(query.universeId === undefined ? {} : { universeId: query.universeId }),
  }).toString();
};

const readJson = async <T>(
  response: Response,
  parser: { parse: (value: unknown) => T },
): Promise<T> => {
  const payload: unknown = await response.json();

  if (response.ok === false) {
    const error = ApiErrorSchema.parse(payload);

    throw new Error(error.message);
  }

  return parser.parse(payload);
};

export const fetchReportCollection = async (query: ReportQuery): Promise<ReportCollection> => {
  const response = await fetch(`/api/reports?${buildSearchParameters(query)}`);

  return await readJson(response, ReportCollectionSchema);
};

export const fetchReportDetail = async (
  reportId: string,
  query: ReportQuery,
): Promise<ReportDetail> => {
  const response = await fetch(`/api/reports/${reportId}?${buildSearchParameters(query)}`);

  return await readJson(response, ReportDetailSchema);
};

export const fetchSnapshotList = async (): Promise<SnapshotList> => {
  const response = await fetch("/api/snapshots");

  return await readJson(response, SnapshotListSchema);
};

export const fetchSnapshotCollection = async (snapshotId: string): Promise<ReportCollection> => {
  const response = await fetch(`/api/snapshots/${snapshotId}`);

  return await readJson(response, ReportCollectionSchema);
};

export const fetchSnapshotReport = async (
  snapshotId: string,
  reportId: string,
): Promise<ReportDetail> => {
  const response = await fetch(`/api/snapshots/${snapshotId}/reports/${reportId}`);

  return await readJson(response, ReportDetailSchema);
};

export const fetchUniverseList = async (): Promise<SavedUniverseList> => {
  const response = await fetch("/api/universes");

  return await readJson(response, SavedUniverseListSchema);
};

export const createUniverse = async (input: CreateSavedUniverseInput): Promise<SavedUniverse> => {
  const response = await fetch("/api/universes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(CreateSavedUniverseInputSchema.parse(input)),
  });

  return await readJson(response, SavedUniverseSchema);
};

export const deleteUniverse = async (universeId: string): Promise<void> => {
  const response = await fetch(`/api/universes/${universeId}`, {
    method: "DELETE",
  });

  await readJson(response, {
    parse: (value: unknown): { readonly deleted: true } => {
      const payload = value as { deleted?: unknown };

      if (payload.deleted !== true) {
        throw new Error("Universe deletion did not complete.");
      }

      return { deleted: true };
    },
  });
};
