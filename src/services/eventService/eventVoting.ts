import { 
  doc, 
  getDoc, 
  serverTimestamp,
  runTransaction,
  type Transaction
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
  EventStatus, 
  EventFormat,
  type OrganizerRating,
  type EventCriteria // Add EventCriteria here
} from '@/types/event';
import { type EnrichedStudentData, type UserData } from '@/types/student';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { isEmpty } from '@/utils/eventUtils';
import { BEST_PERFORMER_LABEL, EVENTS_COLLECTION } from '@/utils/constants';

/**
 * Submits criteria votes and best performer selection for a team event.
 * Uses the new data structure with separate criteriaVotes and bestPerformerSelections maps.
 */
export async function submitTeamCriteriaVoteInFirestore(
    eventId: string,
    userId: string,
    votes: { criteria: Record<string, string>; bestPerformer?: string }
): Promise<void> {
    if (!eventId || !userId) throw new Error("Event ID and User ID are required.");
    if (!votes || typeof votes.criteria !== 'object' || isEmpty(votes.criteria)) {
        throw new Error("Criteria votes are required and cannot be empty.");
    }

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    try {
        await runTransaction(getFirestoreInstance(), async (transaction: Transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error('Event not found in transaction.');
            
            const currentEventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
            if (!currentEventData) throw new Error('Failed to map event data in transaction.');

            // Validation checks
            if (currentEventData.status !== EventStatus.Approved) {
                throw new Error("Voting is only allowed for 'Completed' events.");
            }
            if (!currentEventData.votingOpen) throw new Error("Voting is currently closed for this event.");
            if (currentEventData.details.format !== EventFormat.Team) throw new Error("Team criteria voting only for team events.");
            
            const isParticipant = (currentEventData.participants?.includes(userId) || 
                                   currentEventData.teamMemberFlatList?.includes(userId));
            if (!isParticipant) {
                throw new Error("Only event participants or team members can vote.");
            }

            // Prepare update data using proper structure
            const updateData: Record<string, unknown> = { // Changed from any
                lastUpdatedAt: serverTimestamp()
            };

            // Handle criteria votes - store in separate criteriaVotes map
            if (votes.criteria && Object.keys(votes.criteria).length > 0) {
                const currentCriteriaVotes = currentEventData.criteriaVotes || {};
                const userCriteriaVotes: Record<string, string> = {};
                
                // Validate criteria votes against existing event criteria
                Object.entries(votes.criteria).forEach(([constraintKey, selectedTeamName]) => {
                    const constraintIndex = parseInt(constraintKey.replace('constraint', ''));
                    if (isNaN(constraintIndex)) {
                        console.warn(`Invalid constraint key: ${constraintKey}`);
                        return;
                    }

                    // Check if criteria exists
                    const criteriaExists = currentEventData.criteria?.some((c: EventCriteria) => 
                        typeof c.constraintIndex === 'number' && c.constraintIndex === constraintIndex
                    );

                    if (criteriaExists) {
                        userCriteriaVotes[constraintKey] = selectedTeamName;
                    } else {
                        console.warn(`criteria with index ${constraintIndex} not found`);
                    }
                });

                updateData.criteriaVotes = {
                    ...currentCriteriaVotes,
                    [userId]: userCriteriaVotes
                };
            }

            // Handle best performer selection
            if (votes.bestPerformer) {
                const currentBestPerformerSelections = currentEventData.bestPerformerSelections || {};
                updateData.bestPerformerSelections = {
                    ...currentBestPerformerSelections,
                    [userId]: votes.bestPerformer
                };
            }

            transaction.update(eventRef, updateData as any);
        });
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to submit team criteria vote for event ${eventId}.`;
        throw new Error(message);
    }
}

/**
 * Submits individual winner votes (for individual/competition events)
 */
export async function submitIndividualWinnerVoteInFirestore(
    eventId: string,
    userId: string,
    votes: { criteria: Record<string, string> }
): Promise<void> {
    if (!eventId || !userId) throw new Error("Event ID and User ID are required.");
    if (!votes || typeof votes.criteria !== 'object' || isEmpty(votes.criteria)) {
        throw new Error("Criteria votes are required and cannot be empty.");
    }

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    try {
        await runTransaction(getFirestoreInstance(), async (transaction: Transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error('Event not found in transaction.');
            
            const currentEventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
            if (!currentEventData) throw new Error('Failed to map event data in transaction.');

            // Validation checks
            if (currentEventData.status !== EventStatus.Approved) {
                throw new Error("Voting is only allowed for 'Completed' events.");
            }
            if (!currentEventData.votingOpen) throw new Error("Voting is currently closed for this event.");
            if (currentEventData.details.format === EventFormat.Team) {
                throw new Error("Individual winner voting not for team events.");
            }
            if (!currentEventData.participants?.includes(userId)) {
                throw new Error("Only event participants can vote for winners.");
            }

            // Validate that selected winners are participants and not the voter themselves
            const invalidVotes = Object.values(votes.criteria).filter(selectedUserId => 
                !currentEventData.participants?.includes(selectedUserId) || selectedUserId === userId
            );
            if (invalidVotes.length > 0) {
                throw new Error("Cannot vote for non-participants or yourself.");
            }

            // Prepare update data
            const currentCriteriaVotes = currentEventData.criteriaVotes || {};
            const userCriteriaVotes: Record<string, string> = {};
            
            // Validate criteria votes against existing event criteria
            Object.entries(votes.criteria).forEach(([constraintKey, selectedUserId]) => {
                const constraintIndex = parseInt(constraintKey.replace('constraint', ''));
                if (isNaN(constraintIndex)) {
                    console.warn(`Invalid constraint key: ${constraintKey}`);
                    return;
                }

                // Check if criteria exists
                const criteriaExists = currentEventData.criteria?.some((c: EventCriteria) => 
                    typeof c.constraintIndex === 'number' && c.constraintIndex === constraintIndex
                );

                if (criteriaExists) {
                    userCriteriaVotes[constraintKey] = selectedUserId;
                } else {
                    console.warn(`criteria with index ${constraintIndex} not found`);
                }
            });

            const updatePayload: Record<string, unknown> = { // Added type
                criteriaVotes: {
                    ...currentCriteriaVotes,
                    [userId]: userCriteriaVotes
                },
                lastUpdatedAt: serverTimestamp()
            };
            transaction.update(eventRef, updatePayload as any);
        });
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to submit individual winner vote for event ${eventId}.`;
        throw new Error(message);
    }
}

/**
 * Records an organizer rating for an event using a Map structure.
 */
export async function submitOrganizationRatingInFirestore(payload: {
    eventId: string;
    userId: string;
    score: number;
    feedback?: string | null;
}): Promise<void> {
    const { eventId, userId, score, feedback } = payload;
    if (!eventId || !userId) throw new Error("Event ID and User ID are required.");
    if (score < 1 || score > 5) throw new Error("Rating score must be between 1 and 5.");

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);

    try {
        await runTransaction(getFirestoreInstance(), async (transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error("Event not found.");
            
            const eventData = eventSnap.data();
            if (!['Completed', 'Closed'].includes(eventData.status)) {
                throw new Error("You can only rate organizers for completed or closed events.");
            }

            const isParticipant = (eventData.participants || []).includes(userId) || 
                                  (eventData.teamMemberFlatList || []).includes(userId);

            if (!isParticipant) {
                throw new Error("Only event participants can rate organizers.");
            }

            // Check if user has already rated (prevent duplicate ratings)
            if (eventData.organizerRatings && eventData.organizerRatings[userId]) {            // Allow updating existing rating
            }

            const newRating: OrganizerRating = {
                userId: userId,
                rating: score,
                ratedAt: serverTimestamp() as any,
            };
            if (feedback && feedback.trim()) {
                newRating.feedback = feedback.trim();
            }

            transaction.update(eventRef, {
                [`organizerRatings.${userId}`]: newRating,
                lastUpdatedAt: serverTimestamp()
            });
        });
    } catch (error: unknown) { // Changed from any
        console.error(`Error submitting rating for event ${eventId}:`, error);
        const message = error instanceof Error ? error.message : 'Failed to submit rating.';
        throw new Error(message);
    }
}

/**
 * Toggles the voting status (open/closed) for an event.
 */
export async function toggleVotingStatusInFirestore(eventId: string, open: boolean, currentUser: EnrichedStudentData | UserData | null): Promise<void> {
    if (!currentUser) throw new Error("Authentication required to change voting status.");
    if (!eventId) throw new Error("Event ID is required.");
    if (!currentUser?.uid) throw new Error("User performing action is required for permission check.");

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    try {
        await runTransaction(getFirestoreInstance(), async (transaction: Transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error("Event not found.");
            const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
            if (!eventData) throw new Error("Failed to map event data.");

            const isOrganizer = eventData.details.organizers.includes(currentUser!.uid);
            if (!isOrganizer) {
                throw new Error("Permission denied. Only event organizers can toggle voting status.");
            }

            if (open === true && eventData.status === EventStatus.Closed) {
                throw new Error(`Cannot open voting for an event that is already ${eventData.status}.`);
            }

            if (eventData.status !== EventStatus.Approved) {
                throw new Error(`Voting can only be toggled for 'Approved' events. Current status: ${eventData.status}`);
            }

            const updatePayload: Record<string, unknown> = { // Added type
                votingOpen: open,
                lastUpdatedAt: serverTimestamp()
            };
            transaction.update(eventRef, updatePayload as any);
        });
    } catch (error: unknown) { // Changed from any
        throw new Error((error instanceof Error ? error.message : 'Unknown error') || `Failed to toggle voting status for event ${eventId}.`);
    }
}

/**
 * Calculates winners from the new criteriaVotes structure.
 */
export async function calculateWinnersFromVotes(eventId: string): Promise<Record<string, string[]>> {
    if (!eventId) throw new Error("Event ID is required.");

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) throw new Error("Event not found for calculating winners.");

    const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
    if (!eventData) {
        throw new Error("Failed to map event data for calculating winners.");
    }

    const winners: Record<string, string[]> = {};

    // Calculate winners from criteriaVotes structure
    if (eventData.criteriaVotes && !isEmpty(eventData.criteriaVotes)) {
        // Group all votes by criteria
        const criteriaVoteCounts: Record<string, Record<string, number>> = {};

        Object.values(eventData.criteriaVotes).forEach((userVotes: Record<string, string>) => {
            Object.entries(userVotes).forEach(([constraintKey, selectedEntityId]) => {
                if (!criteriaVoteCounts[constraintKey]) {
                    criteriaVoteCounts[constraintKey] = {};
                }
                if (!criteriaVoteCounts[constraintKey]![selectedEntityId]) {
                    criteriaVoteCounts[constraintKey]![selectedEntityId] = 0;
                }
                criteriaVoteCounts[constraintKey]![selectedEntityId] += 1;
            });
        });

        // Find winners for each criteria
        Object.entries(criteriaVoteCounts).forEach(([constraintKey, voteCounts]) => {
            if (!isEmpty(voteCounts)) {
                const maxVotes = Math.max(...Object.values(voteCounts));
                const criteriaWinners = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
                
                // Get criteria title from event data
                const constraintIndex = parseInt(constraintKey.replace('constraint', ''));
                const criteria = eventData.criteria?.find((c: EventCriteria) => c.constraintIndex === constraintIndex);
                const criteriaTitle = criteria?.title || `criteria ${constraintIndex}`;
                
                // Always store winners as an array, even for single winners
                if (criteriaWinners.length > 0) {
                    // Filter out any undefined values just to be safe
                    winners[criteriaTitle] = criteriaWinners.filter(Boolean);
                } else {
                    // If no winners (shouldn't happen but for safety)
                    winners[criteriaTitle] = [];
                }
            }
        });
    }

    // Calculate winner from bestPerformerSelections
    if (eventData.bestPerformerSelections && !isEmpty(eventData.bestPerformerSelections)) {
        const bestPerformerVoteCounts: Record<string, number> = {};
        Object.values(eventData.bestPerformerSelections).forEach((selectedUserId: string) => {
            bestPerformerVoteCounts[selectedUserId] = (bestPerformerVoteCounts[selectedUserId] || 0) + 1;
        });

        if (!isEmpty(bestPerformerVoteCounts)) {
            const maxVotes = Math.max(...Object.values(bestPerformerVoteCounts));
            const bestPerformers = Object.keys(bestPerformerVoteCounts).filter(id => bestPerformerVoteCounts[id] === maxVotes);
            
            // Always store as array, even for single winner
            if (bestPerformers.length > 0) {
                winners[BEST_PERFORMER_LABEL] = bestPerformers.filter(Boolean);
            } else {
                winners[BEST_PERFORMER_LABEL] = [];
            }
        }
    }

    return winners;
}

/**
 * Allows an organizer to manually select/override winners for an event.
 */
export async function submitManualWinnerSelectionInFirestore(
    eventId: string,
    userId: string, 
    selections: Record<string, string | string[]> 
): Promise<void> {
    if (!eventId || !userId) throw new Error("Event ID and User ID are required.");
    if (!selections || isEmpty(selections)) throw new Error("Winner selections are required.");

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    try {
        await runTransaction(getFirestoreInstance(), async (transaction: Transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error('Event not found.');
            const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
            if (!eventData) throw new Error('Failed to map event data.');

            const isOrganizer = eventData.details.organizers.includes(userId);
            if (!isOrganizer) throw new Error("Permission denied. Only event organizers can manually select winners.");

            if (eventData.status !== EventStatus.Approved) {
                throw new Error("Manual winner selection is only allowed for completed events.");
            }

            // Validate selections format, ensuring all values are arrays of strings
            const validatedWinners: Record<string, string[]> = {};
            for (const [key, value] of Object.entries(selections)) { 
                if (Array.isArray(value)) {
                    const validIds = value.filter(id => typeof id === 'string' && id.trim());
                    if (validIds.length > 0) {
                        validatedWinners[key] = validIds;
                    }
                } else if (typeof value === 'string' && value.trim()) {
                    validatedWinners[key] = [value.trim()];
                }
            }

            if (isEmpty(validatedWinners)) { 
                throw new Error("No valid winner selections provided."); 
            }

            const updatePayload: Record<string, unknown> = { // Added type
                winners: validatedWinners,
                manuallySelectedBy: userId,
                lastUpdatedAt: serverTimestamp()
            };
            transaction.update(eventRef, updatePayload as any);
        });
    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to submit manual winner selection for event ${eventId}.`;
        throw new Error(message);
    }
}

/**
 * Finalizes winners for an event by calculating from votes or using existing manual selections.
 */
export async function finalizeWinnersInFirestore(
    eventId: string, 
    currentUser: EnrichedStudentData | UserData | null
): Promise<Record<string, string | string[]>> {
    if (!eventId) throw new Error("Event ID required.");
    if (!currentUser?.uid) throw new Error("User performing action is required for permission check.");

    const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
    let finalWinners: Record<string, string | string[]> = {};

    try {
        await runTransaction(getFirestoreInstance(), async (transaction: Transaction) => {
            const eventSnap = await transaction.get(eventRef);
            if (!eventSnap.exists()) throw new Error("Event not found.");
            const eventData = mapFirestoreToEventData(eventSnap.id, eventSnap.data());
            if (!eventData) throw new Error("Failed to map event data.");

            const isOrganizer = eventData.details.organizers.includes(currentUser.uid);
            if (!isOrganizer) {
                throw new Error("Permission denied. Only event organizers can finalize winners.");
            }

            if (eventData.status !== EventStatus.Approved) {
                throw new Error("Winners can only be finalized for 'Completed' events.");
            }
            if (eventData.votingOpen === true) {
                throw new Error("Voting must be closed before finalizing winners. Please close voting first.");
            }            if (!isEmpty(eventData.winners)) {
                finalWinners = eventData.winners!;
            } else {
                finalWinners = await calculateWinnersFromVotes(eventId);
                if (isEmpty(finalWinners)) {
                    throw new Error("No winners could be determined from votes. Manual selection might be required.");
                }
            }
            
            transaction.update(eventRef, {
                winners: finalWinners,
                lastUpdatedAt: serverTimestamp()
            });
        });
        
        return finalWinners;

    } catch (error: unknown) { // Changed from any
        const message = error instanceof Error ? error.message : `Failed to finalize winners for event ${eventId}.`;
        throw new Error(message);
    }
}
