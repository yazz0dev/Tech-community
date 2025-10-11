export const autoGenerateEventTeamsInFirestore = async (
  eventId: string,
  studentUids: { uid: string }[],
  minMembers: number,
  maxMembers: number
): Promise<void> => {
  console.log(
    `Auto-generating teams for event ${eventId} with students`,
    studentUids,
    `min: ${minMembers}, max: ${maxMembers}`
  );
};