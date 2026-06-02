const COLLECTION_KEYS = ['nexus_habits', 'nexus_logs', 'nexus_tasks', 'nexus_notes', 'nexus_folders'] as const;
type CollectionKey = typeof COLLECTION_KEYS[number];

export type BackupPayload = Partial<Record<CollectionKey, unknown>> & {
  schema_version?: unknown;
  nexus_preferences?: unknown;
};

function parseArray(raw: unknown): Record<string, unknown>[] {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function assertStringField(record: Record<string, unknown>, key: string, collection: string) {
  if (typeof record[key] !== 'string' || !record[key]) {
    throw new Error(`${collection} contains an invalid ${key}.`);
  }
}

function normalizeRecords(collection: CollectionKey, raw: unknown): Record<string, unknown>[] {
  const records = parseArray(raw);
  records.forEach(record => {
    assertStringField(record, 'id', collection);
    if ('created_at' in record && typeof record.created_at !== 'string') {
      throw new Error(`${collection} contains an invalid created_at.`);
    }
  });
  return records;
}

export function parsePreferences(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
}

export function validateBackupPayload(payload: unknown): {
  collections: Record<CollectionKey, Record<string, unknown>[]>;
  preferences: Record<string, unknown> | null;
} {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Backup must be a JSON object.');
  }

  const data = payload as BackupPayload;
  const collections = COLLECTION_KEYS.reduce((acc, key) => {
    acc[key] = normalizeRecords(key, data[key]);
    return acc;
  }, {} as Record<CollectionKey, Record<string, unknown>[]>);

  return {
    collections,
    preferences: parsePreferences(data.nexus_preferences),
  };
}
