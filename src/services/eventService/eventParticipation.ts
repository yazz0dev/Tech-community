import type { Submission } from '@/models/event';

export const joinEventByStudentInFirestore = async (
  eventId: string,
  studentId: string
): Promise<void> => {
  console.log(`Student ${studentId} joining event ${eventId}`);
};

export const leaveEventByStudentInFirestore = async (
  eventId: string,
  studentId: string
): Promise<void> => {
  console.log(`Student ${studentId} leaving event ${eventId}`);
};

export const submitProject = async (
  eventId: string,
  studentId: string,
  submissionData: Omit<
    Submission,
    'submittedBy' | 'submittedAt' | 'teamName' | 'participantId'
  >
): Promise<void> => {
  console.log(
    `Student ${studentId} submitting project for event ${eventId}`,
    submissionData
  );
};