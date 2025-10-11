export const submitOrganizationRatingInFirestore = async (payload: {
  eventId: string;
  userId: string;
  score: number;
  feedback: string | null;
}): Promise<void> => {
  console.log('Submitting organization rating:', payload);
};

export const submitTeamCriteriaVoteInFirestore = async (
  eventId: string,
  studentId: string,
  votes: { criteria: Record<string, string>; bestPerformer?: string }
): Promise<void> => {
  console.log(
    `Submitting team criteria vote for event ${eventId} by student ${studentId}:`,
    votes
  );
};

export const submitIndividualWinnerVoteInFirestore = async (
  eventId: string,
  studentId: string,
  votes: { criteria: Record<string, string> }
): Promise<void> => {
  console.log(
    `Submitting individual winner vote for event ${eventId} by student ${studentId}:`,
    votes
  );
};

export const submitManualWinnerSelectionInFirestore = async (
  eventId: string,
  studentId: string,
  winnerSelections: Record<string, string | string[]>
): Promise<void> => {
  console.log(
    `Submitting manual winner selection for event ${eventId} by student ${studentId}:`,
    winnerSelections
  );
};