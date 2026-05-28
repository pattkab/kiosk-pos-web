import {
  deleteFromStore,
  getAllFromStore,
  putInStore,
} from "@/lib/storage/db";
import { SyncConflictRecord } from "@/types/offline";

export async function listSyncConflicts(includeResolved = false) {
  const rows = await getAllFromStore<SyncConflictRecord>("sync_conflicts");
  return rows
    .filter((row) => includeResolved || !row.resolvedAt)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function recordSyncConflict(
  input: Omit<SyncConflictRecord, "id" | "createdAt" | "resolvedAt"> & {
    id?: string;
  },
) {
  const record: SyncConflictRecord = {
    id: input.id ?? crypto.randomUUID(),
    entityType: input.entityType,
    entityLocalId: input.entityLocalId,
    title: input.title,
    message: input.message,
    details: input.details,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  await putInStore("sync_conflicts", record);
  return record;
}

export async function resolveSyncConflict(id: string) {
  const rows = await getAllFromStore<SyncConflictRecord>("sync_conflicts");
  const target = rows.find((row) => row.id === id);
  if (!target) return null;

  const updated: SyncConflictRecord = {
    ...target,
    resolvedAt: new Date().toISOString(),
  };
  await putInStore("sync_conflicts", updated);
  return updated;
}

export async function deleteResolvedConflicts() {
  const rows = await getAllFromStore<SyncConflictRecord>("sync_conflicts");
  for (const row of rows.filter((entry) => entry.resolvedAt)) {
    await deleteFromStore("sync_conflicts", row.id);
  }
}
