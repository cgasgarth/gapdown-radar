import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

import {
  ReportDetailSchema,
  ReportQuerySchema,
  SnapshotListSchema,
  SnapshotMetadataSchema,
  type DataMode,
  type ReportDetail,
  type ReportQuery,
  type SnapshotList,
  type SnapshotMetadata,
} from "@gapdown-radar/contracts";
import { z } from "zod";

const SnapshotReadyReportSchema = ReportDetailSchema.omit({ snapshot: true });
const SnapshotFileSchema = z.object({
  metadata: SnapshotMetadataSchema,
  reports: z.array(ReportDetailSchema),
});

type SnapshotReadyReport = z.infer<typeof SnapshotReadyReportSchema>;
type SnapshotFile = z.infer<typeof SnapshotFileSchema>;

const snapshotDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../data/snapshots",
);

const buildSnapshotId = (dataMode: DataMode): string => {
  const timestamp = new Date().toISOString().replaceAll(":", "-");

  return `${timestamp}-${dataMode}`;
};

const buildStorageKey = (snapshotId: string): string => `${snapshotId}.json`;

const buildSnapshotPath = (storageKey: string): string => {
  return path.join(snapshotDirectory, storageKey);
};

const sameQuery = (left: ReportQuery, right: ReportQuery): boolean => {
  const parsedLeft = ReportQuerySchema.parse(left);
  const parsedRight = ReportQuerySchema.parse(right);

  return JSON.stringify(parsedLeft) === JSON.stringify(parsedRight);
};

const sortSnapshots = (left: SnapshotMetadata, right: SnapshotMetadata): number =>
  right.createdAt.localeCompare(left.createdAt);

const isMissingDirectoryError = (error: unknown): boolean => {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
};

const readSnapshotFileSafely = async (storageKey: string): Promise<SnapshotFile | null> => {
  try {
    return await readSnapshotFile(storageKey);
  } catch {
    return null;
  }
};

const readSnapshotFile = async (storageKey: string): Promise<SnapshotFile> => {
  const raw = await readFile(buildSnapshotPath(storageKey), "utf8");

  return SnapshotFileSchema.parse(JSON.parse(raw));
};

const attachSnapshot = (metadata: SnapshotMetadata, report: SnapshotReadyReport): ReportDetail => {
  return ReportDetailSchema.parse({ ...report, snapshot: metadata });
};

export interface ReportSnapshotStore {
  saveSnapshot(
    dataMode: DataMode,
    query: ReportQuery,
    reports: ReadonlyArray<SnapshotReadyReport>,
  ): Promise<SnapshotFile>;
  getLatestMatchingSnapshot(dataMode: DataMode, query: ReportQuery): Promise<StoredSnapshot | null>;
  getSnapshot(snapshotId: string): Promise<StoredSnapshot | null>;
  listSnapshots(): Promise<SnapshotList>;
}

export type StoredSnapshot = SnapshotFile;

export class FileReportSnapshotStore implements ReportSnapshotStore {
  public async saveSnapshot(
    dataMode: DataMode,
    query: ReportQuery,
    reports: ReadonlyArray<SnapshotReadyReport>,
  ): Promise<SnapshotFile> {
    await mkdir(snapshotDirectory, { recursive: true });

    const snapshotId = buildSnapshotId(dataMode);
    const storageKey = buildStorageKey(snapshotId);
    const metadata = SnapshotMetadataSchema.parse({
      snapshotId,
      createdAt: new Date().toISOString(),
      dataMode,
      reportCount: reports.length,
      storageKey,
      query,
    });
    const payload = SnapshotFileSchema.parse({
      metadata,
      reports: reports.map((report) =>
        attachSnapshot(metadata, SnapshotReadyReportSchema.parse(report)),
      ),
    });

    await writeFile(buildSnapshotPath(storageKey), JSON.stringify(payload, null, 2), "utf8");

    return payload;
  }

  public async getLatestMatchingSnapshot(
    dataMode: DataMode,
    query: ReportQuery,
  ): Promise<StoredSnapshot | null> {
    const snapshots = await this.listSnapshots();
    const matchingSnapshot = snapshots.snapshots.find((snapshot) => {
      return snapshot.dataMode === dataMode && sameQuery(snapshot.query, query);
    });

    if (matchingSnapshot === undefined) {
      return null;
    }

    return await readSnapshotFileSafely(matchingSnapshot.storageKey);
  }

  public async getSnapshot(snapshotId: string): Promise<StoredSnapshot | null> {
    const snapshots = await this.listSnapshots();
    const snapshot = snapshots.snapshots.find((candidate) => candidate.snapshotId === snapshotId);

    if (snapshot === undefined) {
      return null;
    }

    return await readSnapshotFileSafely(snapshot.storageKey);
  }

  public async listSnapshots(): Promise<SnapshotList> {
    try {
      const files = await readdir(snapshotDirectory, { withFileTypes: true });
      const snapshotFiles = await Promise.all(
        files
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map(async (entry) => await readSnapshotFileSafely(entry.name)),
      );
      const snapshots = snapshotFiles
        .filter((snapshot): snapshot is SnapshotFile => snapshot !== null)
        .map((snapshot) => snapshot.metadata)
        .sort(sortSnapshots);

      return SnapshotListSchema.parse({
        generatedAt: new Date().toISOString(),
        snapshots,
      });
    } catch (error) {
      if (isMissingDirectoryError(error)) {
        return SnapshotListSchema.parse({ generatedAt: new Date().toISOString(), snapshots: [] });
      }

      throw error;
    }
  }
}
