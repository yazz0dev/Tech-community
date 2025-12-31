import { 
  collection, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { DateTime } from 'luxon';
import { 
  type Event, 
  EventStatus
} from '@/types/event';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { EVENTS_COLLECTION } from '@/utils/constants';
import type { DateInput } from '@/utils/dateTime'; // Import DateInput

/**
 * Checks if a student already has an active (Pending) event request.
 * @param studentId - The UID of the student to check.
 * @returns Promise<boolean> - True if an active request exists, false otherwise.
 */
export async function checkExistingPendingRequest(studentId: string): Promise<boolean> {
    if (!studentId) return false;
    try {
        const q = query(
            collection(getFirestoreInstance(), EVENTS_COLLECTION),
            where('requestedBy', '==', studentId),
            where('status', '==', EventStatus.Pending)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error checking existing student requests:", error);
        throw new Error(`Failed to check existing requests: ${message}`);
    }
}

/**
 * Checks if the proposed event dates conflict with existing Approved/InProgress/Completed events.
 * @param startDateInput - Proposed start date.
 * @param endDateInput - Proposed end date.
 * @param excludeEventId - Optional ID of an event to exclude (used when editing).
 * @returns Promise with conflict information
 */
export async function checkDateConflictForRequest(
    startDateInput: Date | string | Timestamp | null | undefined,
    endDateInput: Date | string | Timestamp | null | undefined,
    excludeEventId?: string | null
): Promise<{ 
    hasConflict: boolean; 
    nextAvailableDate: string | null; 
    conflictingEvent: Event | null; 
    conflictingEventName: string | null 
}> {
    const getValidDateTime = (input: DateInput | DateTime): DateTime | null => { // Changed from any
        if (!input) return null;
        let dt: DateTime;
        if (input instanceof Timestamp) dt = DateTime.fromJSDate(input.toDate());
        else if (input instanceof Date) dt = DateTime.fromJSDate(input);
        else if (typeof input === 'string') dt = DateTime.fromISO(input);
        else if (typeof input === 'object' && 'seconds' in input && 'nanoseconds' in input && !(input instanceof Date)) { // Handle PlainTimestamp from DateInput
             dt = DateTime.fromJSDate(new Timestamp(input.seconds, input.nanoseconds).toDate());
        } else if (input instanceof DateTime) { // Explicitly handle DateTime if passed
            dt = input;
        }
        else return null;
        return dt.isValid ? dt.setZone('Asia/Kolkata').startOf('day') : null;
    };

    const checkStartLuxon = getValidDateTime(startDateInput);
    const checkEndLuxon = getValidDateTime(endDateInput);

    if (!checkStartLuxon || !checkEndLuxon) {
        throw new Error('Invalid date(s) provided for conflict check.');
    }
    if (checkEndLuxon < checkStartLuxon) {
        throw new Error('End date cannot be before start date.');
    }

    const q = query(
        collection(getFirestoreInstance(), EVENTS_COLLECTION),
        where('status', 'in', [EventStatus.Approved, EventStatus.Approved, EventStatus.Approved])
    );

    try {
        const querySnapshot = await getDocs(q);
        let conflictingEvent: Event | null = null;
        let conflictingEventName: string | null = null;
        let hasConflict = false;
        let earliestConflictEndMillis: number | null = null;

        for (const docSnap of querySnapshot.docs) {
            if (excludeEventId && docSnap.id === excludeEventId) continue;

            const event = mapFirestoreToEventData(docSnap.id, docSnap.data());
            if (!event || !event.details.date.start || !event.details.date.end) continue;

            const eventStartLuxon = getValidDateTime(event.details.date.start);
            const eventEndLuxon = getValidDateTime(event.details.date.end);

            if (!eventStartLuxon || !eventEndLuxon) continue;

            if (checkStartLuxon <= eventEndLuxon && checkEndLuxon >= eventStartLuxon) {
                hasConflict = true;
                conflictingEvent = event;
                conflictingEventName = event.details.eventName || "an existing event";
                if (earliestConflictEndMillis === null || eventEndLuxon.toMillis() > earliestConflictEndMillis) {
                    earliestConflictEndMillis = eventEndLuxon.toMillis();
                }
                break; 
            }
        }

        let nextAvailableDateISO: string | null = null;
        if (hasConflict && earliestConflictEndMillis) {
            nextAvailableDateISO = DateTime.fromMillis(earliestConflictEndMillis).plus({ days: 1 }).startOf('day').toISODate();
        }

        return { hasConflict, nextAvailableDate: nextAvailableDateISO, conflictingEvent, conflictingEventName };
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("Firestore date conflict check query error:", error);
        throw new Error(`Failed to check date conflicts: ${message}`);
    }
}
