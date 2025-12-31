import { 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
  type Event, 
  EventStatus, 
  type EventLifecycleTimestamps
} from '@/types/event';
import { type EnrichedStudentData, type UserData } from '@/types/student';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { calculateEventXP } from '@/utils/eventUtils';
import { EVENTS_COLLECTION } from '@/utils/constants';
import { applyXpAwardsBatch, type XpFieldUpdates } from '@/services/xpService';
import { mapCalcRoleToFirestoreKey } from '@/types/xp';

/**
 * Updates the status of an event document in Firestore.
 * @param eventId - The ID of the event.
 * @param newStatus - The new EventStatus.
 * @param currentUser - The user attempting to update the status.
 * @param rejectionReason - Optional reason for rejection.
 * @returns Promise<Partial<Event>> - Returns the specific fields that were updated.
 */
export async function updateEventStatusInFirestore(
    eventId: string,
    newStatus: EventStatus,
    currentUser: UserData
): Promise<Partial<Event>> {
    const validStatuses = Object.values(EventStatus);
    if (!validStatuses.includes(newStatus)) throw new Error(`Invalid status: ${newStatus}.`);
    if (!eventId) throw new Error('Event ID required for status update.');
    if (!currentUser?.uid) throw new Error('User not authenticated for status update.');

    const db = getFirestoreInstance();
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found.');
        const currentEvent = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
        if (!currentEvent) throw new Error('Failed to map current event data.');

        const updatesToApply: Record<string, unknown> = {
            status: newStatus,
            lastUpdatedAt: serverTimestamp(),
        };
        
        const currentLifecycleTimestamps = currentEvent.lifecycleTimestamps || {};
        const updatedLifecycleTimestamps: Partial<EventLifecycleTimestamps> = {};

        switch (newStatus) {
            case EventStatus.Approved:
                (updatedLifecycleTimestamps as Record<string, unknown>)['approvedAt'] = serverTimestamp();
                break;
            case EventStatus.Closed:
                throw new Error(`Use 'closeEventAndAwardXP' service function to close an event.`);
            case EventStatus.Pending:
                throw new Error(`Changing status back to '${newStatus}' is not supported here.`);
        }
        
        if (Object.keys(updatedLifecycleTimestamps).length > 0) {
            updatesToApply['lifecycleTimestamps'] = {
                ...currentLifecycleTimestamps,
                ...updatedLifecycleTimestamps
            };
        }

        await updateDoc(eventRef, updatesToApply as unknown as Record<string, any>);
        const { lastUpdatedAt: _lastUpdatedAt, ...otherUpdates } = updatesToApply;
        const returnedUpdates: Partial<Event> = { ...otherUpdates } as Partial<Event>;
        if (updatesToApply['lifecycleTimestamps']) {
            returnedUpdates.lifecycleTimestamps = updatesToApply['lifecycleTimestamps'] as Partial<EventLifecycleTimestamps>;
        }
         if (updatesToApply['status']) {
            returnedUpdates.status = updatesToApply['status'] as EventStatus;
        }
        if (updatesToApply['votingOpen'] !== undefined) {
            returnedUpdates.votingOpen = updatesToApply['votingOpen'] as boolean;
        }
        return returnedUpdates; 

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : `Failed to update event status to ${newStatus}.`;
        throw new Error(message);
    }
}

/**
 * Closes an event, updates its status, and awards XP to participants in a single atomic transaction.
 * @param eventId The ID of the event to close.
 * @param closingUser The user profile performing the close operation.
 * @returns Promise resolving to an object with success status.
 */
export const closeEvent = async (
  eventId: string,
  closingUser: EnrichedStudentData | UserData
): Promise<{ success: boolean; message: string }> => {
  if (!eventId) throw new Error('Event ID is required.');
  if (!closingUser?.uid) throw new Error('Closing user and their UID are required.');

  const db = getFirestoreInstance();
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);

  try {
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      throw new Error('Event not found.');
    }

    const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data()) as Event;
    if (!eventData) {
      throw new Error('Failed to map event data for closing.');
    }

    // Permission check
    const isOrganizerOrRequester = eventData.details.organizers?.includes(closingUser.uid) || eventData.requestedBy === closingUser.uid;
    if (!isOrganizerOrRequester) {
      throw new Error('User does not have permission to close this event.');
    }

    if (eventData.status !== EventStatus.Approved) {
      throw new Error("Event must be in 'Approved' status to be closed.");
    }

    // Award XP
    const xpAwards = calculateEventXP(eventData);
    if (xpAwards.length > 0) {
      const xpChangesMap: Record<string, XpFieldUpdates> = {};
      for (const award of xpAwards) {
        if (!xpChangesMap[award.userId]) {
          xpChangesMap[award.userId] = {};
        }
        const firestoreKey = mapCalcRoleToFirestoreKey(award.role);
        const userUpdates = xpChangesMap[award.userId];
        if (userUpdates) {
          userUpdates[firestoreKey] = (userUpdates[firestoreKey] || 0) + award.points;
          if (award.isWinner) {
            userUpdates.count_wins = (userUpdates.count_wins || 0) + 1;
          }
        }
      }
      const xpBatch = applyXpAwardsBatch(xpChangesMap, eventId, eventData.details.eventName);
      await xpBatch.commit();
    }

    // Update event status to Closed and set lifecycle timestamps
    const updatePayload: Record<string, unknown> = {
      status: EventStatus.Closed,
      lastUpdatedAt: serverTimestamp(),
      lifecycleTimestamps: {
        ...(eventData.lifecycleTimestamps || {}),
        closedAt: serverTimestamp(),
        closedBy: closingUser.uid,
      },
      xpAwardingStatus: 'completed',
      xpAwardedAt: serverTimestamp(),
    };

    await updateDoc(eventRef, updatePayload as unknown as Record<string, any>);

    return {
      success: true,
      message: `Event "${eventData.details.eventName}" has been successfully closed and XP awarded.`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while closing the event.';
    console.error(`Error closing event for ${eventId}:`, error);
    throw new Error(`Failed to close event: ${errorMessage}`);
  }
};


/**
 * Deletes a pending event request from Firestore.
 * @param eventId - The ID of the event to delete.
 * @param userId - The UID of the user making the request.
 */
export async function deleteEventRequestInFirestore(eventId: string, userId: string): Promise<void> {
    if (!eventId) throw new Error('Event ID is required to delete the request.');
    if (!userId) throw new Error('User ID is required for validation.');

    const db = getFirestoreInstance();
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            throw new Error('Event request not found or already deleted.');
        }
        const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
        if (!eventData) {
            throw new Error('Failed to map event data.');
        }
        if (eventData.requestedBy !== userId) {
            throw new Error('You do not have permission to delete this event request.');
        }
        if (eventData.status !== EventStatus.Pending) {
            throw new Error(`Only events with 'Pending' status can be deleted. Current status: ${eventData.status}`);
        }

        await deleteDoc(eventRef);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : `Failed to delete event request ${eventId}.`;
        throw new Error(message);
    }
}
