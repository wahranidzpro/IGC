import { logger } from '@/lib/logger';

export interface VersionedRecord {
  id?: number | string;
  local_id?: string;
  updatedAt: Date | string;
  version?: number;
  [key: string]: any;
}

export interface ConflictResult<T extends VersionedRecord> {
  action: 'use_local' | 'use_cloud' | 'merge';
  merged?: T;
  reason: string;
}

export function resolveTimestampConflict<T extends VersionedRecord>(
  local: T,
  cloud: T,
  mergeFields?: (keyof T)[],
): ConflictResult<T> {
  const localTime = new Date(local.updatedAt).getTime();
  const cloudTime = new Date(cloud.updatedAt).getTime();
  const localVer = local.version || 0;
  const cloudVer = cloud.version || 0;

  if (cloudVer > localVer) {
    return { action: 'use_cloud', reason: `Cloud version ${cloudVer} > local ${localVer}` };
  }
  if (localVer > cloudVer) {
    return { action: 'use_local', reason: `Local version ${localVer} > cloud ${cloudVer}` };
  }

  if (cloudTime > localTime + 2000) {
    return { action: 'use_cloud', reason: `Cloud updated ${new Date(cloudTime).toISOString()} > local ${new Date(localTime).toISOString()}` };
  }
  if (localTime > cloudTime + 2000) {
    return { action: 'use_local', reason: `Local updated > cloud` };
  }

  if (mergeFields && cloudTime > localTime - 5000 && cloudTime < localTime + 5000) {
    const merged = { ...local };
    let mergedCount = 0;
    for (const field of mergeFields) {
      if (JSON.stringify(local[field]) !== JSON.stringify(cloud[field])) {
        merged[field] = cloud[field];
        mergedCount++;
      }
    }
    if (mergedCount > 0) {
      merged.updatedAt = new Date();
      merged.version = Math.max(localVer, cloudVer) + 1;
      return { action: 'merge', merged: merged as T, reason: `Merged ${mergedCount} fields from cloud` };
    }
    return { action: 'use_local', reason: 'Records identical' };
  }

  if (localTime >= cloudTime) {
    return { action: 'use_local', reason: 'Local is newer or equal' };
  }
  return { action: 'use_cloud', reason: 'Cloud is newer' };
}

export function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

export function detectDuplicate(
  records: VersionedRecord[],
  matchFields: string[],
  threshold: number = 0.8,
): VersionedRecord[] {
  const dupes: VersionedRecord[] = [];
  const checked = new Set<number | string>();

  for (let i = 0; i < records.length; i++) {
    if (checked.has(records[i].id ?? i)) continue;

    for (let j = i + 1; j < records.length; j++) {
      if (checked.has(records[j].id ?? j)) continue;

      let matches = 0;
      for (const field of matchFields) {
        const a = String(records[i][field] || '').toLowerCase().trim();
        const b = String(records[j][field] || '').toLowerCase().trim();
        if (a && b && a === b) matches++;
      }

      const score = matchFields.length > 0 ? matches / matchFields.length : 0;
      if (score >= threshold) {
        checked.add(records[i].id ?? i);
        checked.add(records[j].id ?? j);
        dupes.push(records[i], records[j]);
      }
    }
  }

  return [...new Set(dupes)];
}
