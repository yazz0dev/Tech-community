import { 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
  type Event as EventData, // Alias Event to EventData
  EventFormat,
  type Team
} from '@/types/event';
import { mapFirestoreToEventData } from '@/utils/eventDataUtils';
import { deepClone } from '@/utils/eventUtils';
import { EVENTS_COLLECTION, MIN_TEAM_MEMBERS, MAX_TEAM_MEMBERS } from '@/utils/constants';

/**
 * Auto-generates teams for an event by distributing students among pre-defined team shells.
 * @param eventId - The ID of the event.
 * @param students - Array of student objects.
 * @param minMembersPerTeam - Minimum members required for a team.
 * @param maxMembersPerTeam - Maximum members a team can have.
 * @returns Promise<Team[]> - The array of generated teams.
 */
export async function autoGenerateEventTeamsInFirestore(
  eventId: string,
  students: Array<{ uid: string; [key: string]: unknown }>, // Changed from any to unknown
  minMembersPerTeam: number = 2, // Default will be clamped by MIN_TEAM_MEMBERS
  maxMembersPerTeam: number = 8  // Default will be clamped by MAX_TEAM_MEMBERS
): Promise<Team[]> {
  if (!eventId) throw new Error("Event ID is required.");
  if (!Array.isArray(students)) throw new Error("Students input must be an array.");
  
  // Enforce min/max constraints from constants (this part is from the original file structure)
  if (minMembersPerTeam < MIN_TEAM_MEMBERS) minMembersPerTeam = MIN_TEAM_MEMBERS;
  if (maxMembersPerTeam > MAX_TEAM_MEMBERS) maxMembersPerTeam = MAX_TEAM_MEMBERS;
  if (minMembersPerTeam > maxMembersPerTeam) throw new Error("Maximum members per team cannot be less than minimum.");

  const eventRef = doc(getFirestoreInstance(), EVENTS_COLLECTION, eventId);
  try {
    const eventSnapshot = await getDoc(eventRef);
    if (!eventSnapshot.exists()) throw new Error("Event not found.");
    
    const eventData = mapFirestoreToEventData(eventSnapshot.id, eventSnapshot.data()) as EventData | null;
    if (!eventData) throw new Error('Failed to map event data.');

    if (eventData.details.format !== EventFormat.Team) {
      throw new Error("Auto-generation of teams is only applicable to 'Team' format events.");
    }
    if (!eventData.teams || eventData.teams.length === 0) { 
      throw new Error("Auto-generation requires at least one team shell (name) to be pre-defined in the event details.");
    }
    
    // Prepare team shells: clone existing teams and clear members/leads
    const populatedTeams: Team[] = deepClone(eventData.teams).map((team: Team) => ({
      ...team, // Preserves id, teamName from the shell
      members: [],
      teamLead: '', // Initialize teamLead as empty string
    }));

    if (populatedTeams.length === 0) {
        // This case should ideally be caught by the eventData.teams.length check earlier
        throw new Error("No team shells available to populate.");
    }

    // Extract student UIDs and shuffle them
    const studentUids = students.map(s => s.uid).filter(uid => typeof uid === 'string' && uid.trim() !== '');
    const shuffledStudentUids = [...studentUids].sort(() => 0.5 - Math.random());

    let currentStudentIndex = 0;
    
    // Distribute students in a round-robin fashion
    // Continue as long as there are students to assign and capacity in the last pass
    let studentAssignedInLastPass = true; 
    while (currentStudentIndex < shuffledStudentUids.length && studentAssignedInLastPass) {
        studentAssignedInLastPass = false; // Reset for the current pass
        for (let i = 0; i < populatedTeams.length; i++) {
            if (currentStudentIndex >= shuffledStudentUids.length) break; // All students assigned

            const team = populatedTeams[i];
            // Add a check for team to satisfy TypeScript, though it should theoretically not be undefined
            if (team) {
                // Use the clamped maxMembersPerTeam (parameter adjusted by constants)
                if (team.members.length < maxMembersPerTeam) { 
                    const studentUidToAdd = shuffledStudentUids[currentStudentIndex];
                    // Ensure studentUidToAdd is valid before using it
                    if (studentUidToAdd) {
                        team.members.push(studentUidToAdd);
                        if (team.members.length === 1) { // Set first member as lead
                            team.teamLead = studentUidToAdd;
                        }
                        currentStudentIndex++;
                        studentAssignedInLastPass = true; // A student was assigned in this pass
                    }
                }
            }
        }
    }
    
    // Note: Teams might have fewer than `minMembersPerTeam` if not enough students are available.
    // The function's primary goal is distribution. Validity of team sizes post-distribution
    // (e.g., against MIN_TEAM_MEMBERS) might be handled by other validation logic or UI.

    const newTeamMemberFlatList = [...new Set(populatedTeams.flatMap(team => team.members).filter(Boolean))];

    await updateDoc(eventRef, {
        teams: populatedTeams,
        teamMemberFlatList: newTeamMemberFlatList,
        lastUpdatedAt: serverTimestamp()
    });

    return populatedTeams;
  } catch (error: unknown) { // Changed from any
    console.error(`Error auto-generating teams for event ${eventId}:`, error);
    const message = error instanceof Error ? error.message : `Failed to auto-generate teams for event ${eventId}.`;
    throw new Error(message);
  }
}
