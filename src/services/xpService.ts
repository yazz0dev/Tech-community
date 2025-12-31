import { doc, writeBatch, increment, Timestamp, type WriteBatch, arrayUnion } from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import type { XPData, XpFirestoreFieldKey, XPPointHistoryItem, XpCalculationRoleKey } from '@/types/xp';

// Helper to get current Firestore Timestamp, similar to createTimestamp in stores
const now = () => Timestamp.now();

/**
 * Type for XP field updates when awarding XP
 * This defines what XP fields can be incremented in a batch operation
 */
export type XpFieldUpdates = Partial<Pick<XPData, XpFirestoreFieldKey | 'count_wins' | 'totalCalculatedXp'>>;

/**
 * Prepares a Firestore batch write to apply XP awards to student profiles.
 * This function creates the batch but does NOT commit it, allowing it to be combined
 * with other operations in an atomic transaction.
 *
 * @param xpChangesMap - A map where keys are student IDs and values are XP field increments
 * @param eventId - The ID of the event for which XP is being awarded
 * @param eventName - The name of the event, to be stored in the XP history
 * @returns A Firestore WriteBatch instance, ready to be committed by the caller
 * @throws An error if the number of users exceeds Firestore's batch operation limit for a single transaction
 */
export const applyXpAwardsBatch = (
  xpChangesMap: Record<string, XpFieldUpdates>,
  eventId: string,
  eventName: string
): WriteBatch => {
  const userIds = Object.keys(xpChangesMap);
  if (userIds.length === 0) {
    console.info('No XP changes to apply, returning an empty batch.');
    return writeBatch(getFirestoreInstance());
  }
  
  if (userIds.length >= 499) {
      throw new Error(`Cannot award XP to ${userIds.length} users at once from the client. The limit is 498 per event closure to ensure atomicity.`);
  }

  if (!eventId || !eventName) {
    // Changed from console.warn and returning empty batch to throwing an error.
    // This makes the operation fail explicitly if context for history is missing.
    // closeEventAndAwardXP already checks for eventName, so this is an additional safeguard.
    console.error('applyXpAwardsBatch: Event ID or Event Name is missing. Cannot create valid XP history.');
    throw new Error('Event ID or Event Name is missing, cannot reliably award XP with history.');
  }

  const batch = writeBatch(getFirestoreInstance());

  for (const userId of userIds) {
    const xpIncrements = xpChangesMap[userId];
    if (!userId || !xpIncrements) {
      console.warn('Skipping XP update for empty user ID or empty increments');
      continue;
    }
    
    const xpDocRef = doc(getFirestoreInstance(), 'xp', userId);
    const updatePayload: Record<string, any> = { lastUpdatedAt: now() };
    const historyItems: XPPointHistoryItem[] = [];
    let userHasUpdates = false;
    let totalXpIncrementForThisUser = 0;

    for (const key in xpIncrements) {
      const typedKey = key as keyof XpFieldUpdates;
      const incrementValue = xpIncrements[typedKey];

      if (typeof incrementValue === 'number' && incrementValue > 0) {
        if (key.startsWith('xp_')) {
          updatePayload[key] = increment(incrementValue);
          totalXpIncrementForThisUser += incrementValue;
          userHasUpdates = true;

          const role = key.substring(3) as XpCalculationRoleKey;
          historyItems.push({
            eventId,
            eventName,
            role,
            points: incrementValue,
            awardedAt: now(),
          });

        } else if (key === 'count_wins') {
          updatePayload[key] = increment(incrementValue);
          userHasUpdates = true;
        } 
      }
    }

    if (totalXpIncrementForThisUser > 0) {
      updatePayload.totalCalculatedXp = increment(totalXpIncrementForThisUser);
    }
    
    if (historyItems.length > 0) {
        updatePayload.pointHistory = arrayUnion(...historyItems);
    }

    if (userHasUpdates) {
      batch.set(xpDocRef, updatePayload, { merge: true });
    }
  }
  
  return batch;
};

/**
 * Creates an XP update object for a single role
 * @param role The XP role to update
 * @param amount The amount to increment
 * @returns An XpFieldUpdates object with the role updated
 */
export function createXpUpdate(role: XpFirestoreFieldKey, amount: number): XpFieldUpdates {
  if (amount <= 0) {
    console.warn(`Ignoring non-positive XP amount: ${amount} for role: ${role}`);
    return {};
  }
  
  return {
    [role]: amount,
  };
}