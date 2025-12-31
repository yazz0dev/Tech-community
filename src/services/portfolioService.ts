import { fetchStudentData } from './profileService'; // Import from profileService
import {
    collection,
    query,
    where,
    getDocs,
    documentId,
    Timestamp
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';
import { 
    type Event, // Assuming Event type is correctly defined and imported
    EventFormat, 
    EventStatus 
} from '@/types/event'; 
import type { 
    StudentPortfolioProject, 
    StudentEventHistoryItem, 
    StudentPortfolioGenerationData,
    EnrichedStudentData // Assuming this is defined elsewhere or should be imported
} from '@/types/student'; // Assuming these types are defined in student.ts

/**
 * Fetch student's projects for portfolio display based on event participation.
 * @param targetStudentId The UID of the student.
 * @param participatedEventIDs Array of event IDs the student participated in.
 * @param organizedEventIDs Array of event IDs the student organized.
 * @returns Promise that resolves with an array of StudentPortfolioProject.
 */
export const fetchStudentPortfolioProjects = async (
  targetStudentId: string,
  participatedEventIDs?: string[],
  organizedEventIDs?: string[]
): Promise<StudentPortfolioProject[]> => {
  const relevantEventIds = [...new Set([...(participatedEventIDs || []), ...(organizedEventIDs || [])])].filter(Boolean);
  if (relevantEventIds.length === 0) return [];
  
  try {
    const projects: StudentPortfolioProject[] = [];
    // Firestore 'in' query supports up to 30 elements in the array, so batch if necessary.
    // The original code used 30, so we will stick to that.
    for (let i = 0; i < relevantEventIds.length; i += 30) {
        const batchIds = relevantEventIds.slice(i, i + 30);
        if (batchIds.length === 0) continue;
        
        const eventQuery = query(collection(getFirestoreInstance(), "events"), where(documentId(), 'in', batchIds));
        const eventSnapshot = await getDocs(eventQuery);
        
        eventSnapshot.forEach(eventDoc => {
            const event = { id: eventDoc.id, ...eventDoc.data() } as Event; // Assuming Event type is correctly defined and imported
            (event.submissions || []).forEach(sub => {
                let isRelevantSubmission = sub.submittedBy === targetStudentId;
                // If it's a team event, check if the student was part of the submitting team
                if (event.details.format === EventFormat.Team && sub.teamName) {
                    const team = event.teams?.find(t => t.teamName === sub.teamName);
                    if (team?.members.includes(targetStudentId)) {
                        isRelevantSubmission = true;
                    }
                }
                if (isRelevantSubmission) {
                    projects.push({
                        id: `${event.id}-${sub.projectName.replace(/\s+/g, '-')}`,
                        eventId: event.id,
                        eventName: event.details.eventName,
                        projectName: sub.projectName,
                        description: sub.description,
                        link: sub.link,
                        submittedAt: sub.submittedAt, // This will be Firestore Timestamp or undefined
                        eventFormat: event.details.format,
                        submittedBy: sub.submittedBy
                    });
                }
            });
        });
    }
    // Sort projects by submission date, newest first
    return projects.sort((a, b) =>
        (b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : 0) -
        (a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : 0)
    );
  } catch (error) {
    console.error(`Error fetching portfolio projects for ${targetStudentId}:`, error);
    throw error;
  }
};

/**
 * Fetch student's event history for display.
 * @param targetStudentId The UID of the student.
 * @param participatedEventIDs Array of event IDs the student participated in.
 * @param organizedEventIDs Array of event IDs the student organized.
 * @returns Promise that resolves with an array of StudentEventHistoryItem.
 */
export const fetchStudentEventHistory = async (
  targetStudentId: string,
  participatedEventIDs?: string[],
  organizedEventIDs?: string[]
): Promise<StudentEventHistoryItem[]> => {
  const relevantEventIds = [...new Set([...(participatedEventIDs || []), ...(organizedEventIDs || [])])].filter(Boolean);
  if (relevantEventIds.length === 0) return [];
  
  try {
    const history: StudentEventHistoryItem[] = [];
    // Batching for Firestore 'in' query (max 30 per query)
    for (let i = 0; i < relevantEventIds.length; i += 30) {
        const batchIds = relevantEventIds.slice(i, i + 30);
        if (batchIds.length === 0) continue;
        
        const eventQuery = query(collection(getFirestoreInstance(), "events"), where(documentId(), 'in', batchIds));
        const eventSnapshot = await getDocs(eventQuery);
        
        eventSnapshot.forEach(eventDoc => {
            const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
            // Include event if it's not in a preliminary/rejected state, OR if the student requested it (even if pending/rejected)
            if (![EventStatus.Pending].includes(event.status as EventStatus) ||
                event.requestedBy === targetStudentId
            ) {
                let roleInEvent: StudentEventHistoryItem['roleInEvent'] = 'participant'; // Default role
                if (event.details.organizers?.includes(targetStudentId)) {
                    roleInEvent = 'organizer';
                } else if (event.details.format === EventFormat.Team) {
                    const team = event.teams?.find(t => t.members.includes(targetStudentId));
                    if (team) {
                        roleInEvent = team.teamLead === targetStudentId ? 'team_lead' : 'team_member';
                    }
                }
                // If still 'participant', ensure they were actually a participant if participants list exists and is used
                // This part of logic might need refinement based on how participation is tracked (e.g. explicit participants array vs. submission)
                // For now, if not organizer or specific team role, default to participant if they were involved.
                
                history.push({
                    eventId: event.id,
                    eventName: event.details.eventName,
                    eventStatus: event.status,
                    eventFormat: event.details.format,
                    roleInEvent,
                    date: event.details.date as { start: Timestamp | null; end: Timestamp | null; } // Assert type
                });
            }
        });
    }
    // Sort history by event start date, newest first
    return history.sort((a, b) =>
        (b.date.start instanceof Timestamp ? b.date.start.toMillis() : 0) -
        (a.date.start instanceof Timestamp ? a.date.start.toMillis() : 0)
    );
  } catch (error) {
    console.error(`Error fetching event history for ${targetStudentId}:`, error);
    throw error;
  }
};

/**
 * Calculates the count of valid event participations for a student.
 * @param participatedEventIDs Array of event IDs the student is marked as having participated in.
 * @returns Promise that resolves with the count of valid participations.
 */
export const fetchStudentEventParticipationCount = async (
  participatedEventIDs?: string[]
): Promise<number> => {
  if (!participatedEventIDs || participatedEventIDs.length === 0) {
    return 0;
  }
  
  let validParticipationCount = 0;
  try {
    // Firestore 'in' query limit is 30; batching if necessary.
    for (let i = 0; i < participatedEventIDs.length; i += 30) {
      const batchIds = participatedEventIDs.slice(i, i + 30);
      if (batchIds.length === 0) continue;

      const eventQuery = query(collection(getFirestoreInstance(), "events"), where(documentId(), 'in', batchIds));
      const eventSnapshot = await getDocs(eventQuery);
      
      eventSnapshot.forEach(eventDoc => {
        const event = { id: eventDoc.id, ...eventDoc.data() } as Event; // Assuming Event type includes 'status'
        // Count as valid if the event status is not Cancelled, Rejected, or Pending
        if (event.status !== EventStatus.Pending) {
          validParticipationCount++;
        }
      });
    }
    return validParticipationCount;
  } catch (error) {
    console.error("Error fetching student event participation count:", error);
    throw error; // Re-throw for the store/caller to handle
  }
};

/**
 * Enhanced function to fetch comprehensive portfolio data for a student
 * @param targetStudentId The UID of the student
 * @param participatedEventIDs Array of event IDs the student participated in
 * @param organizedEventIDs Array of event IDs the student organized
 * @returns Promise that resolves with comprehensive portfolio generation data
 */
export const fetchComprehensivePortfolioData = async (
  targetStudentId: string,
  participatedEventIDs?: string[],
  organizedEventIDs?: string[]
): Promise<StudentPortfolioGenerationData> => {
  // const relevantEventIds = [...new Set([...(participatedEventIDs || []), ...(organizedEventIDs || [])])].filter(Boolean); // Not directly used here, but used by sub-functions
  
  try {
    // Fetch student data
    const studentData = await fetchStudentData(targetStudentId); // Uses imported function
    if (!studentData) {
      throw new Error('Student data not found');
    }

    // Fetch enhanced projects and event history
    const [projects, eventHistory] = await Promise.all([
      fetchEnhancedStudentPortfolioProjects(targetStudentId, participatedEventIDs, organizedEventIDs),
      fetchEnhancedStudentEventHistory(targetStudentId, participatedEventIDs, organizedEventIDs)
    ]);

    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(studentData, projects, eventHistory);
    
    // Extract achievements
    const achievements = extractAchievements(projects, eventHistory);
    
    // Build skills matrix
    const skillsMatrix = buildSkillsMatrix(studentData.skills || [], projects, eventHistory);
    
    // Gather recommendations (placeholder - would need additional data structure)
    const recommendations = extractRecommendations(projects, eventHistory);

    return {
      student: studentData,
      projects,
      eventHistory,
      eventParticipationCount: await fetchStudentEventParticipationCount(participatedEventIDs),
      portfolioMetrics,
      achievements,
      skillsMatrix,
      recommendations
    };
  } catch (error) {
    console.error(`Error fetching comprehensive portfolio data for ${targetStudentId}:`, error);
    throw error;
  }
};

/**
 * Enhanced function to fetch student's projects with additional portfolio information
 */
export const fetchEnhancedStudentPortfolioProjects = async (
  targetStudentId: string,
  participatedEventIDs?: string[],
  organizedEventIDs?: string[]
): Promise<StudentPortfolioProject[]> => {
  const relevantEventIds = [...new Set([...(participatedEventIDs || []), ...(organizedEventIDs || [])])].filter(Boolean);
  if (relevantEventIds.length === 0) return [];
  
  try {
    const projects: StudentPortfolioProject[] = [];
    
    for (let i = 0; i < relevantEventIds.length; i += 30) {
      const batchIds = relevantEventIds.slice(i, i + 30);
      if (batchIds.length === 0) continue;
      
      const eventQuery = query(collection(getFirestoreInstance(), "events"), where(documentId(), 'in', batchIds));
      const eventSnapshot = await getDocs(eventQuery);
      
      eventSnapshot.forEach(eventDoc => {
        const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
        
        (event.submissions || []).forEach(sub => {
          let isRelevantSubmission = sub.submittedBy === targetStudentId;
          let teamInfo: { teamName?: string; teamMembers?: string[]; role?: string } = {};
          
          if (event.details.format === EventFormat.Team && sub.teamName) {
            const team = event.teams?.find(t => t.teamName === sub.teamName);
            if (team?.members.includes(targetStudentId)) {
              isRelevantSubmission = true;
              teamInfo = {
                teamName: sub.teamName,
                teamMembers: team.members,
                role: team.teamLead === targetStudentId ? 'Team Lead' : 'Team Member'
              };
            }
          }
          
          if (isRelevantSubmission) {
            // Extract technologies from description or tags
            const technologies = extractTechnologiesFromText(sub.description || '');
            
            projects.push({
              id: `${event.id}-${sub.projectName.replace(/\s+/g, '-')}`,
              eventId: event.id,
              eventName: event.details.eventName,
              eventDate: event.details.date as { start: Timestamp | null; end: Timestamp | null; }, // Assert type
              eventStatus: event.status,
              projectName: sub.projectName,
              description: sub.description,
              link: sub.link,
              submittedAt: sub.submittedAt,
              eventFormat: event.details.format,
              submittedBy: sub.submittedBy,
              ...teamInfo,
              technologies,
              // Additional portfolio-specific fields
              githubUrl: extractGithubUrl(sub.link),
              liveUrl: extractLiveUrl(sub.link),
              achievements: extractProjectAchievements(sub, event),
              submissionRank: getSubmissionRank(sub, event.submissions || []),
            });
          }
        });
      });
    }
    
    return projects.sort((a, b) =>
      (b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : 0) -
      (a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : 0)
    );
  } catch (error) {
    console.error(`Error fetching enhanced portfolio projects for ${targetStudentId}:`, error);
    throw error;
  }
};

/**
 * Enhanced function to fetch student's event history with additional information
 */
export const fetchEnhancedStudentEventHistory = async (
  targetStudentId: string,
  participatedEventIDs?: string[],
  organizedEventIDs?: string[]
): Promise<StudentEventHistoryItem[]> => {
  const relevantEventIds = [...new Set([...(participatedEventIDs || []), ...(organizedEventIDs || [])])].filter(Boolean);
  if (relevantEventIds.length === 0) return [];
  
  try {
    const history: StudentEventHistoryItem[] = [];
    
    for (let i = 0; i < relevantEventIds.length; i += 30) {
      const batchIds = relevantEventIds.slice(i, i + 30);
      if (batchIds.length === 0) continue;
      
      const eventQuery = query(collection(getFirestoreInstance(), "events"), where(documentId(), 'in', batchIds));
      const eventSnapshot = await getDocs(eventQuery);
      
      eventSnapshot.forEach(eventDoc => {
        const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
        
        if (event.status !== EventStatus.Pending ||
            event.requestedBy === targetStudentId) {
          
          let roleInEvent: StudentEventHistoryItem['roleInEvent'] = 'participant';
          let skillsGained: string[] = [];
          let awardsReceived: string[] = [];
          
          if (event.details.organizers?.includes(targetStudentId)) {
            roleInEvent = 'organizer';
            skillsGained.push('Leadership', 'Event Management', 'Team Coordination');
          } else if (event.details.format === EventFormat.Team) {
            const team = event.teams?.find(t => t.members.includes(targetStudentId));
            if (team) {
              roleInEvent = team.teamLead === targetStudentId ? 'team_lead' : 'team_member';
              if (roleInEvent === 'team_lead') {
                skillsGained.push('Team Leadership', 'Project Management');
              }
              skillsGained.push('Collaboration', 'Teamwork');
            }
          }
          
          // Extract skills from event description or type
          const eventTypeSkills = extractSkillsFromEventType(event.details.eventName, event.details.description);
          skillsGained.push(...eventTypeSkills);
          
          // Check for awards/recognitions
          const studentSubmissions = (event.submissions || []).filter(sub => 
            sub.submittedBy === targetStudentId || 
            (event.teams?.find(t => t.teamName === sub.teamName)?.members.includes(targetStudentId))
          );
          
          if (studentSubmissions.length > 0) {
            awardsReceived = extractAwardsFromSubmissions(studentSubmissions, event);
          }
          
          history.push({
            eventId: event.id,
            eventName: event.details.eventName,
            eventStatus: event.status,
            eventFormat: event.details.format,
            eventDescription: event.details.description,
            eventType: extractEventType(event.details.eventName),
            roleInEvent,
            date: event.details.date as { start: Timestamp | null; end: Timestamp | null; }, // Assert type
            organizerNames: event.details.organizers || [],
            participantCount: calculateParticipantCount(event),
            projectsSubmitted: studentSubmissions.length,
            skillsGained: [...new Set(skillsGained)],
            awardsReceived,
          });
        }
      });
    }
    
    return history.sort((a, b) =>
      (b.date.start instanceof Timestamp ? b.date.start.toMillis() : 0) -
      (a.date.start instanceof Timestamp ? a.date.start.toMillis() : 0)
    );
  } catch (error) {
    console.error(`Error fetching enhanced event history for ${targetStudentId}:`, error);
    throw error;
  }
};

// Helper functions for portfolio enhancement (moved from profileService.ts)
function calculatePortfolioMetrics(
  student: EnrichedStudentData,
  projects: StudentPortfolioProject[],
  events: StudentEventHistoryItem[]
): StudentPortfolioGenerationData['portfolioMetrics'] {
  const totalXP = student.xpData?.totalCalculatedXp || 0;
  const leadershipExperience = events.filter(e => 
    e.roleInEvent === 'organizer' || e.roleInEvent === 'team_lead'
  ).length;
  
  const competitionEvents = events.filter(e => 
    e.eventType?.toLowerCase().includes('competition') || 
    e.eventName.toLowerCase().includes('hackathon')
  );
  const wonEvents = events.filter(e => e.awardsReceived && e.awardsReceived.length > 0);
  const winRate = competitionEvents.length > 0 ? (wonEvents.length / competitionEvents.length) * 100 : 0;
  
  const teamEvents = events.filter(e => e.roleInEvent.includes('team'));
  const collaborationScore = teamEvents.length > 0 ? Math.min(100, teamEvents.length * 10) : 0;
  
  // Calculate consistency based on event participation over time
  const consistencyScore = calculateConsistencyScore(events);
  
  // Extract top skills from projects and student profile
  const allSkills = [
    ...(student.skills || []),
    ...projects.flatMap(p => p.technologies || []),
    ...events.flatMap(e => e.skillsGained || [])
  ];
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topSkills = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([skill]) => skill);
  
  const preferredTechnologies = projects
    .flatMap(p => p.technologies || [])
    .reduce((acc, tech) => {
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const topTechnologies = Object.entries(preferredTechnologies)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([tech]) => tech);

  return {
    totalProjects: projects.length,
    totalEvents: events.length,
    totalXP,
    topSkills,
    preferredTechnologies: topTechnologies,
    leadershipExperience,
    winRate: Math.round(winRate),
    collaborationScore: Math.round(collaborationScore),
    consistencyScore: Math.round(consistencyScore)
  };
}

function extractAchievements(
  projects: StudentPortfolioProject[],
  events: StudentEventHistoryItem[]
): StudentPortfolioGenerationData['achievements'] {
  const awards = events.flatMap(e => e.awardsReceived || []);
  const topRankings = projects
    .filter(p => p.submissionRank && p.submissionRank <= 3)
    .map(p => ({
      eventName: p.eventName || 'Unknown Event',
      rank: p.submissionRank!,
      totalParticipants: 0 // Would need additional data
    }));

  return {
    awards: [...new Set(awards)],
    certifications: [], // Would need additional data structure
    specialRecognitions: [], // Would need additional data structure
    topRankings
  };
}

function buildSkillsMatrix(
  studentSkills: string[],
  projects: StudentPortfolioProject[],
  events: StudentEventHistoryItem[]
): StudentPortfolioGenerationData['skillsMatrix'] {
  const allSkills = new Set([
    ...studentSkills,
    ...projects.flatMap(p => p.technologies || []),
    ...events.flatMap(e => e.skillsGained || [])
  ]);

  return Array.from(allSkills).map(skill => {
    const projectsUsed = projects.filter(p => 
      p.technologies?.includes(skill)
    ).length;
    
    const eventsUsed = events.filter(e => 
      e.skillsGained?.includes(skill)
    ).length;
    
    const totalUsage = projectsUsed + eventsUsed;
    const proficiencyLevel = totalUsage >= 8 ? 'Expert' : 
                           totalUsage >= 5 ? 'Advanced' : 
                           totalUsage >= 3 ? 'Intermediate' : 'Beginner';
    
    const lastUsedProject = projects
      .filter(p => p.technologies?.includes(skill))
      .sort((a, b) => (b.submittedAt instanceof Timestamp ? b.submittedAt.toMillis() : 0) - 
                     (a.submittedAt instanceof Timestamp ? a.submittedAt.toMillis() : 0))[0];
    
    const lastUsed: Timestamp | null = lastUsedProject?.submittedAt instanceof Timestamp 
      ? lastUsedProject.submittedAt 
      : null;

    return {
      skill,
      proficiencyLevel: proficiencyLevel as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
      projectsUsed,
      eventsUsed,
      lastUsed
    };
  }).sort((a, b) => (a.projectsUsed + a.eventsUsed) - (b.projectsUsed + b.eventsUsed)).reverse();
}

function extractRecommendations(
  projects: StudentPortfolioProject[],
  _events: StudentEventHistoryItem[]
): StudentPortfolioGenerationData['recommendations'] {
  // Placeholder - would need additional data structure for mentor feedback
  const recommendations: StudentPortfolioGenerationData['recommendations'] = [];
  
  projects.forEach(project => {
    if (project.mentorFeedback) {
      const date = project.submittedAt instanceof Timestamp 
        ? project.submittedAt 
        : Timestamp.now();
      
      const recommendation = {
        source: `${project.eventName || 'Unknown Event'} Mentor`,
        content: project.mentorFeedback,
        date
      };
      
      // Only add eventContext if it exists and is not undefined
      if (project.eventName) {
        (recommendation as any).eventContext = project.eventName;
      }
        
      recommendations.push(recommendation);
    }
  });
  
  return recommendations;
}

// Additional helper functions
function extractTechnologiesFromText(text: string): string[] {
  const techKeywords = [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#',
    'node.js', 'express', 'mongodb', 'mysql', 'postgresql', 'firebase', 'aws', 'docker',
    'kubernetes', 'git', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma'
  ];
  
  const foundTech = techKeywords.filter(tech => 
    text.toLowerCase().includes(tech.toLowerCase())
  );
  
  return foundTech.map(tech => tech.charAt(0).toUpperCase() + tech.slice(1));
}

function extractGithubUrl(link: string): string | undefined {
  if (link.includes('github.com')) {
    return link;
  }
  return undefined;
}

function extractLiveUrl(link: string): string | undefined {
  if (!link.includes('github.com')) {
    return link;
  }
  return undefined;
}

function extractProjectAchievements(submission: any, event: Event): string[] {
  const achievements: string[] = [];
  
  // Check if project won any awards (placeholder logic)
  if (submission.rank && typeof submission.rank === 'number' && submission.rank >= 1 && submission.rank <= 3) {
    const positions = ['1st', '2nd', '3rd'];
    const eventName = event.details?.eventName;
    if (eventName) { // This guard ensures eventName is a truthy string
      const index = Math.floor(submission.rank) - 1;
      if (index >= 0 && index < positions.length) { // Ensures index is valid for positions array
        const position = positions[index]!; // Add non-null assertion due to noUncheckedIndexedAccess
        achievements.push(`${position} Place in ${eventName as string}`);
      }
    }
  }
  
  return achievements;
}

function getSubmissionRank(submission: any, _allSubmissions: any[]): number | undefined {
  // Placeholder - would need actual ranking logic
  return submission.rank;
}

function extractSkillsFromEventType(eventName: string, description?: string): string[] {
  const text = `${eventName} ${description || ''}`.toLowerCase();
  const skills: string[] = [];
  
  if (text.includes('hackathon') || text.includes('coding')) {
    skills.push('Problem Solving', 'Rapid Prototyping', 'Innovation');
  }
  if (text.includes('design') || text.includes('ui/ux')) {
    skills.push('Design Thinking', 'User Experience', 'Visual Design');
  }
  if (text.includes('ai') || text.includes('machine learning')) {
    skills.push('Artificial Intelligence', 'Machine Learning', 'Data Science');
  }
  if (text.includes('web') || text.includes('frontend')) {
    skills.push('Web Development', 'Frontend Development');
  }
  
  return skills;
}

function extractEventType(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes('hackathon')) return 'Hackathon';
  if (name.includes('workshop')) return 'Workshop';
  if (name.includes('competition')) return 'Competition';
  if (name.includes('bootcamp')) return 'Bootcamp';
  if (name.includes('seminar')) return 'Seminar';
  return 'Event';
}

function extractAwardsFromSubmissions(submissions: any[], _event: Event): string[] {
  const awards: string[] = [];
  
  submissions.forEach(sub => {
    if (sub.rank && typeof sub.rank === 'number' && sub.rank >= 1 && sub.rank <= 3) {
      const positions = ['Winner', 'Runner-up', 'Second Runner-up'];
      const index = Math.floor(sub.rank) - 1;
      if (index >= 0 && index < positions.length) {
        awards.push(positions[index]!);
      }
    }
  });
  
  return awards;
}

function calculateParticipantCount(event: Event): number {
  const participants = new Set();
  
  // Add individual participants
  (event.participants || []).forEach(p => participants.add(p));
  
  // Add team members
  (event.teams || []).forEach(team => {
    team.members.forEach(member => participants.add(member));
  });
  
  return participants.size;
}

function calculateConsistencyScore(events: StudentEventHistoryItem[]): number {
  if (events.length === 0) return 0;
  
  // Sort events by date
  const sortedEvents = events
    .filter(e => e.date?.start)
    .sort((a, b) => {
      const aTime = a.date?.start?.toMillis() || 0;
      const bTime = b.date?.start?.toMillis() || 0;
      return aTime - bTime;
    });
  
  if (sortedEvents.length < 2) return 50;
  
  // Calculate time span and event frequency
  const firstEventTime = sortedEvents[0]?.date?.start?.toMillis();
  const lastEventTime = sortedEvents[sortedEvents.length - 1]?.date?.start?.toMillis();
  
  if (!firstEventTime || !lastEventTime) return 50;
  
  const timeSpanMonths = (lastEventTime - firstEventTime) / (1000 * 60 * 60 * 24 * 30);
  
  if (timeSpanMonths === 0) return 100;
  
  const eventsPerMonth = sortedEvents.length / timeSpanMonths;
  
  // Score based on consistency (events per month)
  return Math.min(100, eventsPerMonth * 20);
}
