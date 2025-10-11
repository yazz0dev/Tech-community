import { type Event as EventData, EventStatus } from '@/models/event';
import events from '@/data/events.json';

/**
 * Fetches all events.
 * @returns Promise<EventData[]> - An array of all events.
 */
export async function fetchAllEvents(): Promise<EventData[]> {
  return Promise.resolve(events as EventData[]);
}

/**
 * Fetches event requests made by a specific student.
 * @param studentId - The UID of the student.
 * @returns Promise<EventData[]> - An array of the student's event requests.
 */
export async function fetchMyEventRequests(studentId: string): Promise<EventData[]> {
    if (!studentId) {
        return [];
    }
    const myRequests = events.filter(event =>
        event.requestedBy === studentId && event.status === EventStatus.Pending
    );
    return Promise.resolve(myRequests as EventData[]);
}

/**
 * Fetches details for a single event.
 * @param eventId - The ID of the event to fetch.
 * @param currentStudentId - The UID of the currently logged-in student.
 * @returns Promise<EventData | null> - The event object or null if not found/accessible.
 */
export async function fetchSingleEventForStudent(eventId: string, currentStudentId: string | null): Promise<EventData | null> {
    if (!eventId) throw new Error('Event ID required for fetching details.');

    const event = events.find(e => e.id === eventId);
    if (!event) {
        return null;
    }

    const publiclyViewableStatuses = [EventStatus.Approved, EventStatus.Closed];
    const isPublic = publiclyViewableStatuses.includes(event.status as EventStatus);
    const isMyRequest = currentStudentId && event.requestedBy === currentStudentId &&
                        event.status === EventStatus.Pending;

    if (isPublic || isMyRequest) {
        return Promise.resolve(event as EventData);
    } else {
        return null;
    }
}

/**
 * Fetches events that are generally viewable by unauthenticated users.
 */
export async function fetchPubliclyViewableEvents(): Promise<EventData[]> {
  const publicEvents = events.filter(event =>
    [EventStatus.Approved, EventStatus.Closed].includes(event.status as EventStatus)
  );
  return Promise.resolve(publicEvents as EventData[]);
}

/**
 * Checks if a student has an existing event request with 'Pending' status.
 * @param studentId - The UID of the student to check.
 * @returns Promise<boolean> - True if a pending request exists, false otherwise.
 */
export async function hasPendingRequest(studentId: string): Promise<boolean> {
  if (!studentId) {
    return false;
  }
  const hasRequest = events.some(event =>
    event.requestedBy === studentId && event.status === EventStatus.Pending
  );
  return Promise.resolve(hasRequest);
}

/**
 * Fetches events where a student is either a participant or organizer
 * @param studentId - The UID of the student
 * @returns Promise<EventData[]> - An array of events the student is involved in
 */
export async function fetchStudentEvents(studentId: string): Promise<EventData[]> {
  if (!studentId) {
    return [];
  }
  
  const studentEvents = events.filter(event =>
    event.participants?.includes(studentId) ||
    event.details.organizers?.includes(studentId) ||
    event.teamMemberFlatList?.includes(studentId)
  );
  
  return Promise.resolve(studentEvents as EventData[]);
}

/**
 * Fetches events where a student is either a participant or organizer with fallback handling
 * @param studentId - The UID of the student
 * @returns Promise<EventData[]> - An array of events the student is involved in
 */
export async function fetchStudentEventsWithFallback(studentId: string): Promise<EventData[]> {
  return fetchStudentEvents(studentId);
}