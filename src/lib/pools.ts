type PoolConfigEntry = {
  name?: string;
  poolName?: string;
  groupName?: string;
  code?: string;
  qualificationSlots?: number;
};

function normalizePoolName(value: string | null | undefined) {
  return (value || "Overall").trim().toLowerCase();
}

export function parsePoolConfig(poolConfigJson?: string | null): PoolConfigEntry[] {
  if (!poolConfigJson) return [];

  try {
    const parsed = JSON.parse(poolConfigJson);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is PoolConfigEntry => typeof entry === "object" && entry !== null);
  } catch {
    return [];
  }
}

export function isValidPoolConfigJson(poolConfigJson?: string | null) {
  if (!poolConfigJson || !poolConfigJson.trim()) return true;

  try {
    const parsed = JSON.parse(poolConfigJson);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

export function normalizePoolConfig(poolConfigJson?: string | null) {
  const parsed = parsePoolConfig(poolConfigJson)
    .map((entry) => {
      const name = (entry.name || entry.poolName || entry.groupName || entry.code || "").trim();
      const qualificationSlots = Math.max(1, Number(entry.qualificationSlots || 0) || 0);

      if (!name) return null;

      return {
        name,
        qualificationSlots: qualificationSlots || 2,
      };
    })
    .filter((entry): entry is { name: string; qualificationSlots: number } => Boolean(entry));

  return parsed;
}

export function serializePoolConfig(poolConfigJson?: string | null) {
  const normalized = normalizePoolConfig(poolConfigJson);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
}

export function getQualificationSlotsForPool(groupName: string, poolConfigJson?: string | null) {
  const normalizedGroupName = normalizePoolName(groupName);
  const matchingConfig = parsePoolConfig(poolConfigJson).find((entry) =>
    [entry.name, entry.poolName, entry.groupName, entry.code]
      .filter((value): value is string => Boolean(value))
      .some((value) => normalizePoolName(value) === normalizedGroupName),
  );

  return Math.max(1, matchingConfig?.qualificationSlots ?? 2);
}

export function getQualificationStatus(index: number, totalRows: number, groupName: string, poolConfigJson?: string | null) {
  const qualificationSlots = Math.min(getQualificationSlotsForPool(groupName, poolConfigJson), totalRows);
  return totalRows <= qualificationSlots || index < qualificationSlots ? "Qualified" : "Pending";
}
