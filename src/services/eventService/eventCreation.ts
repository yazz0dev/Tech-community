import { type EventFormData } from '@/models/event';

export const createEventRequest = async (
  formData: EventFormData,
  studentId: string
): Promise<string> => {
  console.log('Creating event request for student:', studentId, formData);
  return `evt_${Date.now()}`;
};

export const updateEventRequestInService = async (
  eventId: string,
  formData: EventFormData,
  studentId: string
): Promise<void> => {
  console.log('Updating event request for student:', studentId, eventId, formData);
};