import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { DateTime } from 'luxon';
import {
  type EventDetails,
  EventStatus,
  type EventFormData,
  EventFormat
} from '@/types/event';
import { mapEventDataToFirestore, mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { EVENTS_COLLECTION } from '@/utils/constants';

/**
 * Creates a new event request in Firestore after thorough validation.
 * @param formData - The event form data.
 * @param studentId - The UID of the student making the request.
 * @returns The ID of the newly created event.
 */
export const createEventRequest = async (
  formData: EventFormData,
  studentId: string
): Promise<string> => {
  if (!studentId) throw new Error('Student ID is required to request an event.');
  if (!formData.details?.eventName?.trim()) throw new Error('Event name is required.');
  if (!formData.details?.type?.trim() && formData.details.format !== EventFormat.MultiEvent) {
    throw new Error('Event type is required.');
  }

  // --- Date Validation ---
  const { start: startDateInput, end: endDateInput } = formData.details.date;
  if (!startDateInput || !endDateInput) {
    throw new Error('Both start and end dates are required.');
  }
  const startDateTime = DateTime.fromISO(startDateInput);
  const endDateTime = DateTime.fromISO(endDateInput);
  if (!startDateTime.isValid || !endDateTime.isValid) {
    throw new Error('Invalid date format provided. Please use YYYY-MM-DD.');
  }
  if (endDateTime < startDateTime) {
    throw new Error('Event end date must be on or after the start date.');
  }
  const nowInIST = DateTime.now().setZone('Asia/Kolkata').startOf('day');
  if (startDateTime.startOf('day') < nowInIST) {
    throw new Error('Event start date cannot be in the past.');
  }

  try {
    const db = getFirestoreInstance();
    const newEventRef = doc(collection(db, EVENTS_COLLECTION));
    const newEventId = newEventRef.id;
    
    // Map application data to a clean Firestore-ready object.
    const firestoreData = mapEventDataToFirestore(formData);

    const dataToSubmit: Record<string, unknown> = {
      ...firestoreData,
      requestedBy: studentId,
      status: EventStatus.Pending,
      votingOpen: false,
      organizerRatings: {},
      submissions: [],
      winners: {},
      bestPerformerSelections: {},
      criteriaVotes: {},
      participants: formData.participants || [], // Use participants from root of formData
      teamMemberFlatList: [],
      lifecycleTimestamps: {
        createdAt: serverTimestamp(),
      },
      rejectionReason: null,
      manuallySelectedBy: null,
      gallery: null,
      childEventIds: [],
    };

    // Ensure organizers array always includes the requester.
    const organizers = new Set((dataToSubmit['details'] as EventDetails).organizers || []);
    organizers.add(studentId);
    (dataToSubmit['details'] as EventDetails).organizers = Array.from(organizers);

    await setDoc(newEventRef, dataToSubmit);
    return newEventId;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during event creation.';
    console.error('Error creating event request:', message, error);
    throw new Error(`Failed to create event request: ${message}`);
  }
};

/**
 * Updates an existing event request in Firestore after thorough validation.
 * @param eventId - The ID of the event to update.
 * @param formData - The event form data with updates.
 * @param studentId - The UID of the student making the request.
 */
export const updateEventRequestInService = async (
  eventId: string,
  formData: EventFormData,
  studentId: string
): Promise<void> => {
  if (!eventId) throw new Error('Event ID is required for updates.');
  if (!studentId) throw new Error('Student ID is required for permission checks.');

  const db = getFirestoreInstance();
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  try {
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) throw new Error('Event request not found.');

    const currentEvent = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
    if (!currentEvent) throw new Error('Failed to map current event data.');
    
    const isOrganizer = currentEvent.details.organizers.includes(studentId);
    if (currentEvent.requestedBy !== studentId && !isOrganizer) {
      throw new Error("Permission denied: You can only edit your own event requests or events you organize.");
    }
    if (currentEvent.status !== EventStatus.Pending && !isOrganizer) {
      throw new Error(`Cannot edit request with status: ${currentEvent.status}.`);
    }

    // --- Date Validation ---
    const { start: startDateInput, end: endDateInput } = formData.details.date;
    if (!startDateInput || !endDateInput) {
      throw new Error('Both start and end dates are required.');
    }
    const startDateTime = DateTime.fromISO(startDateInput);
    const endDateTime = DateTime.fromISO(endDateInput);
    if (!startDateTime.isValid || !endDateTime.isValid) {
      throw new Error('Invalid date format provided.');
    }
    if (endDateTime < startDateTime) {
      throw new Error('Event end date must be on or after the start date.');
    }
    const nowInIST = DateTime.now().setZone('Asia/Kolkata').startOf('day');
    if (startDateTime.startOf('day') < nowInIST) {
        throw new Error('Event start date cannot be in the past.');
    }

    // Map form data to a clean Firestore object.
    const mappedUpdates = mapEventDataToFirestore(formData);
    const updatesToApply: Record<string, unknown> = { ...mappedUpdates };
    
    // Ensure protected fields are not overwritten from the form.
    delete updatesToApply['status'];
    delete updatesToApply['requestedBy'];
    delete updatesToApply['lifecycleTimestamps'];
    delete updatesToApply['winners'];
    delete updatesToApply['manuallySelectedBy'];


    // Ensure organizers array always includes the editor.
    const organizers = new Set((updatesToApply['details'] as EventDetails).organizers || []);
    organizers.add(studentId);
    (updatesToApply['details'] as EventDetails).organizers = Array.from(organizers);

    await updateDoc(eventRef, updatesToApply as unknown as Record<string, any>);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during event update.';
    console.error(`Error updating event request ${eventId}:`, message);
    throw new Error(`Failed to update event request: ${message}`);
  }
};