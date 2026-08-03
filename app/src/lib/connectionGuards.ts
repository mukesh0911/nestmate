/**
 * Pure connection / limit helpers — unit-tested without Firebase.
 */

export const FREE_CONNECT_LIMIT = 5;

export interface ConnectionPair {
  fromUserId: string;
  toUserId: string;
}

/** True when either direction already exists between the two users. */
export function findExistingConnectionId(
  pairs: Array<ConnectionPair & { id: string }>,
  fromId: string,
  toId: string
): string | null {
  const hit = pairs.find(
    (c) =>
      (c.fromUserId === fromId && c.toUserId === toId) ||
      (c.fromUserId === toId && c.toUserId === fromId)
  );
  return hit?.id ?? null;
}

/** Whether a free-tier user may send another connect this month. */
export function canSendConnect(params: {
  connectsUsedThisMonth: number;
  isPremium: boolean;
  limit?: number;
  /** When true (current product), free tier is unlimited. */
  unlimitedFree?: boolean;
}): boolean {
  if (params.unlimitedFree || params.isPremium) return true;
  const limit = params.limit ?? FREE_CONNECT_LIMIT;
  return params.connectsUsedThisMonth < limit;
}

/** Count connections created on/after start of calendar month (ms). */
export function countConnectionsSince(
  createdAtMsList: number[],
  startOfMonthMs: number
): number {
  return createdAtMsList.filter((ms) => ms >= startOfMonthMs).length;
}
