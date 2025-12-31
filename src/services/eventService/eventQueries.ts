import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
  type Event as EventData, 
  EventStatus
} from '@/types/event';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { EVENTS_COLLECTION } from '@/utils/constants';

/**
 * Fetches event requests made by a specific student.
 * @param studentId - The UID of the student.
 * @returns Promise<EventData[]> - An array of the student's event requests.
 */
export async function fetchMyEventRequests(studentId: string): Promise<EventData[]> {
    if (!studentId) {
        return [];
    }
    try {
        const db = getFirestoreInstance();
        const q = query(
            collection(db, EVENTS_COLLECTION),
            where('requestedBy', '==', studentId),
            where('status', '==', EventStatus.Pending)
        );
        const snapshot = await getDocs(q);
        
        const mappedEvents = snapshot.docs
            .map(docSnap => mapFirestoreToEventData(docSnap.id, docSnap.data()) as EventData | null)
            .filter((event): event is EventData => event !== null);
        
        // Sort the results in JavaScript instead of in the query
        mappedEvents.sort((a, b) => {
            const aTime = a.lifecycleTimestamps?.createdAt?.toMillis() || 0;
            const bTime = b.lifecycleTimestamps?.createdAt?.toMillis() || 0;
            return bTime - aTime; // Descending order (newest first)
        });
        
        return mappedEvents;
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error in fetchMyEventRequests for ${studentId}:`, error);
        throw new Error(`Failed to fetch your event requests: ${message}`);
    }
}

/**
 * Fetches details for a single event from Firestore.
 * @param eventId - The ID of the event to fetch.
 * @param currentStudentId - The UID of the currently logged-in student.
 * @returns Promise<EventData | null> - The event object or null if not found/accessible.
 */
export async function fetchSingleEventForStudent(eventId: string, currentStudentId: string | null): Promise<EventData | null> {
    if (!eventId) throw new Error('Event ID required for fetching details.');
    const db = getFirestoreInstance();
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            return null;
        }
        const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data()) as EventData | null; // Add type assertion

        if (!eventData) {
            return null;
        }

        const publiclyViewableStatuses = [EventStatus.Approved, EventStatus.Closed];
        const isPublic = publiclyViewableStatuses.includes(eventData.status);
        const isMyRequest = currentStudentId && eventData.requestedBy === currentStudentId && 
                            eventData.status === EventStatus.Pending;

        if (isPublic || isMyRequest) {
            return eventData;
        } else {
            return null; 
        }
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching single event for student (ID: ${eventId}):`, error);
        throw new Error(`Failed to fetch event details for ${eventId}: ${message}`);
    }
}

/**
 * Fetches events that are generally viewable by unauthenticated users.
 */
export async function fetchPubliclyViewableEvents(): Promise<EventData[]> {
  try {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('status', 'in', [
        EventStatus.Approved,
        EventStatus.Closed,
      ]),
      orderBy('details.date.start', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const events: EventData[] = [];
    querySnapshot.forEach((docSnap) => {
      const eventData = mapFirestoreToEventData(docSnap.id, docSnap.data()) as EventData | null; // Add type assertion
      if (eventData) {
        events.push(eventData);
      } else {
        console.warn(`Failed to map event data for document ID: ${docSnap.id} in fetchPubliclyViewableEvents`);
      }
    });
    return events;
  } catch (error: unknown) { // Changed from any
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching publicly viewable events:', error);
    throw new Error(`Failed to fetch public events: ${message}`);
  }
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
  try {
    const db = getFirestoreInstance();
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('requestedBy', '==', studentId),
      where('status', '==', EventStatus.Pending)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: unknown) { // Changed from any
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error checking for pending requests for student ${studentId}:`, error);
    throw new Error(`Failed to check for pending requests: ${message}`);
  }
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
  
  try {
    const db = getFirestoreInstance();
    
    // Query for events where student is a participant - ordered by date descending
    const participantQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('participants', 'array-contains', studentId),
      orderBy('details.date.start', 'desc')
    );
    
    // Query for events where student is an organizer - ordered by date descending
    const organizerQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('details.organizers', 'array-contains', studentId),
      orderBy('details.date.start', 'desc')
    );
    
    // Query for events where student is in teamMemberFlatList - ordered by date descending
    const teamMemberQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('teamMemberFlatList', 'array-contains', studentId),
      orderBy('details.date.start', 'desc')
    );
    
    const [participantSnapshot, organizerSnapshot, teamMemberSnapshot] = await Promise.all([
      getDocs(participantQuery),
      getDocs(organizerQuery),
      getDocs(teamMemberQuery)
    ]);
  
    const eventMap = new Map<string, EventData>();
    
    // Process participant events
    participantSnapshot.docs.forEach(docSnap => {
      const eventData = mapFirestoreToEventData(docSnap.id, docSnap.data()) as EventData | null;
      if (eventData) {
        console.log('Found participant event:', eventData.details.eventName );
        eventMap.set(docSnap.id, eventData);
      }
    });
    
    // Process organizer events
    organizerSnapshot.docs.forEach(docSnap => {
      const eventData = mapFirestoreToEventData(docSnap.id, docSnap.data()) as EventData | null;
      if (eventData) {
        eventMap.set(docSnap.id, eventData);
      }
    });
    
    // Process team member events
    teamMemberSnapshot.docs.forEach(docSnap => {
      const eventData = mapFirestoreToEventData(docSnap.id, docSnap.data()) as EventData | null;
      if (eventData) {
        eventMap.set(docSnap.id, eventData);
      }
    });
    
    // Convert map to array - already sorted by Firebase queries
    const events = Array.from(eventMap.values());
    
    // Since we have multiple queries, we need to sort the combined results
    // Use a more reliable sorting method
    events.sort((a, b) => {
      const aTime = a.details.date.start && typeof a.details.date.start === 'object' && 'toMillis' in a.details.date.start 
        ? a.details.date.start.toMillis() 
        : 0;
      const bTime = b.details.date.start && typeof b.details.date.start === 'object' && 'toMillis' in b.details.date.start 
        ? b.details.date.start.toMillis() 
        : 0;
      return bTime - aTime; // Descending order (newest first)
    });
    
    return events;
  } catch (error: unknown) { // Changed from any
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in fetchStudentEvents for ${studentId}:`, error);
    throw new Error(`Failed to fetch student events: ${message}`);
  }
}

/**
 * Fetches events where a student is either a participant or organizer with fallback handling
 * @param studentId - The UID of the student
 * @returns Promise<EventData[]> - An array of events the student is involved in
 */
export async function fetchStudentEventsWithFallback(studentId: string): Promise<EventData[]> {
  if (!studentId) {
    return [];
  }
  
  try {
    // Try the original function first
    return await fetchStudentEvents(studentId);
  } catch (error: unknown) { // Changed from any
    console.warn(`Primary fetchStudentEvents failed for ${studentId}, trying fallback approach:`, error);
    
    // Fallback: Try to fetch publicly viewable events and filter
    try {
      const publicEvents = await fetchPubliclyViewableEvents();
      
      // Filter events where the student is involved
      const studentEvents = publicEvents.filter(event => {
        return event.participants?.includes(studentId) ||
               event.details.organizers?.includes(studentId) ||
               event.teamMemberFlatList?.includes(studentId);
      });
      
      return studentEvents;
    } catch (fallbackError: unknown) { // Changed from any
      console.error(`Fallback fetchStudentEvents also failed for ${studentId}:`, fallbackError);
      return []; // Return empty array instead of throwing
    }
  }
}
