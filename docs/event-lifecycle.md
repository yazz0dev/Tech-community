# Event Lifecycle and Multi-Event Handling

## Overview

This document explains how events work in the Tech Community Platform, including the complete lifecycle from creation to completion, and how multi-event (multi-phase) events are handled.

## Table of Contents
- [Event Formats](#event-formats)
- [Event Lifecycle](#event-lifecycle)
- [Multi-Event System](#multi-event-system)
- [Event Status Flow](#event-status-flow)
- [Participation](#participation)
- [Team Management](#team-management)
- [Submissions](#submissions)
- [Winner Selection](#winner-selection)

## Event Formats

The platform supports three event formats:

### 1. Individual Events
- Single participants work independently
- No team formation required
- Each participant can submit their own project
- Winners selected from individual participants

**Use Cases:**
- Lightning talks
- Individual presentations
- Solo coding challenges
- Portfolio reviews

**Example:**
```typescript
{
  format: EventFormat.Individual,
  coreParticipants: ['user1', 'user2', 'user3'],
  teams: [] // No teams
}
```

### 2. Team Events
- Participants form teams
- Teams work collaboratively
- One submission per team
- Winners selected from teams

**Use Cases:**
- Hackathons
- Group projects
- Team competitions
- Collaborative workshops

**Example:**
```typescript
{
  format: EventFormat.Team,
  teams: [
    {
      id: 'team1',
      teamName: 'The Innovators',
      members: ['user1', 'user2', 'user3']
    }
  ]
}
```

### 3. MultiEvent (Multi-Phase)
- Events with multiple stages/phases
- Each phase can be Individual or Team format
- Different criteria per phase
- Separate winners per phase
- Comprehensive multi-stage competitions

**Use Cases:**
- Multi-round hackathons (ideation → development → presentation)
- Competitions with qualifiers and finals
- Workshop series with progressive challenges
- Complex project-based learning

**Example:**
```typescript
{
  format: EventFormat.MultiEvent,
  isCompetition: true,
  phases: [
    {
      id: 'phase1',
      phaseName: 'Ideation',
      format: EventFormat.Team,
      // ... phase-specific settings
    },
    {
      id: 'phase2',
      phaseName: 'Development',
      format: EventFormat.Team,
      // ... phase-specific settings
    },
    {
      id: 'phase3',
      phaseName: 'Presentation',
      format: EventFormat.Individual,
      // ... phase-specific settings
    }
  ]
}
```

## Event Lifecycle

### 1. Creation (Pending Status)

**Who:** Any authenticated user
**What:** Submit event request with details

```typescript
// Using eventStore
await eventStore.createEventRequest({
  details: {
    eventName: 'Hackathon 2024',
    description: 'Annual hackathon event',
    format: EventFormat.Team,
    organizers: [currentUserId],
    coreParticipants: [],
    date: {
      start: startDate,
      end: endDate
    },
    allowProjectSubmission: true
  }
});
```

**Event State:**
- Status: `Pending`
- Visible only to creator and admins
- Cannot accept participants yet
- Awaiting admin approval

### 2. Approval (Approved Status)

**Who:** Admins only
**What:** Review and approve event request

```typescript
// Admin approves event
await eventStore.updateEventStatus(eventId, EventStatus.Approved);
```

**Event State:**
- Status: `Approved`
- Publicly visible
- Users can join/register
- Teams can be formed (if Team format)
- Submissions can be made (if enabled)

### 3. Active Participation

**Students Can:**
- Join the event
- Leave the event (before it closes)
- Form teams (Team events)
- Submit projects
- Vote (if voting enabled)

```typescript
// Join event
await eventStore.joinEvent(eventId);

// Leave event
await eventStore.leaveEvent(eventId);

// Submit project
await eventStore.submitProject(eventId, {
  projectName: 'My Project',
  link: 'https://github.com/...',
  description: 'Project description'
});
```

### 4. Closing (Closed Status)

**Who:** Event organizers or admins
**What:** Close event to new participants

```typescript
// Close event
await eventStore.closeEvent(eventId);
```

**Event State:**
- Status: `Closed`
- No new participants allowed
- Existing participants can still submit (if deadline not passed)
- Voting/winner selection can begin
- Still publicly visible for viewing

### 5. Winner Selection

**Who:** Organizers or admins
**What:** Select winners based on criteria

```typescript
// For Individual events
await submitIndividualWinnerVoteInFirestore(
  eventId,
  criteriaKey,
  [winnerId1, winnerId2]
);

// For Team events
await submitTeamCriteriaVoteInFirestore(
  eventId,
  criteriaKey,
  [teamId1, teamId2]
);
```

### Lifecycle Diagram

```
┌─────────────┐
│   Created   │
│  (Pending)  │
└──────┬──────┘
       │
       │ Admin Approval
       ▼
┌─────────────┐
│  Approved   │◄──┐
│  (Active)   │   │ Can reopen
└──────┬──────┘   │
       │          │
       │ Close    │
       ▼          │
┌─────────────┐   │
│   Closed    │───┘
│ (Complete)  │
└─────────────┘
```

## Multi-Event System

Multi-events (MultiEvent format) support complex, multi-phase competitions.

### Structure

```typescript
interface EventPhase {
  id: string;                    // Unique phase ID
  phaseName: string;             // Phase name/identifier
  description: string;           // Phase description
  format: Individual | Team;     // Phase format
  type: string;                  // Phase type
  
  // Participants
  participants: string[];        // Phase participants
  coreParticipants: string[];    // Core participants (Individual)
  
  // Criteria and teams
  criteria: EventCriteria[];     // Phase-specific criteria
  teams: Team[];                 // Phase-specific teams
  
  // Settings
  rules: string | null;
  prize: string | null;
  allowProjectSubmission: boolean;
  
  // Winners
  winners?: Record<string, string[]>;  // Winners per criteria
}
```

### Creating a Multi-Event

```typescript
await eventStore.createEventRequest({
  details: {
    eventName: 'Hackathon Championship',
    description: 'Multi-phase hackathon competition',
    format: EventFormat.MultiEvent,
    isCompetition: true,
    organizers: [currentUserId],
    coreParticipants: [],  // Overall participants
    date: {
      start: overallStartDate,
      end: overallEndDate
    },
    allowProjectSubmission: false,  // Controlled per phase
    
    // Define phases
    phases: [
      {
        id: 'ideation',
        phaseName: 'Ideation Phase',
        description: 'Present your idea',
        format: EventFormat.Team,
        type: 'Presentation',
        participants: [],
        coreParticipants: [],
        teams: [],
        criteria: [
          {
            title: 'Innovation',
            points: 30,
            role: 'xp_problemSolver'
          }
        ],
        rules: 'Submit a 5-minute pitch',
        prize: 'Advance to next round',
        allowProjectSubmission: false
      },
      {
        id: 'development',
        phaseName: 'Development Phase',
        description: 'Build your solution',
        format: EventFormat.Team,
        type: 'Project Development',
        participants: [],
        coreParticipants: [],
        teams: [],
        criteria: [
          {
            title: 'Technical Implementation',
            points: 40,
            role: 'xp_developer'
          },
          {
            title: 'Design Quality',
            points: 30,
            role: 'xp_designer'
          }
        ],
        rules: 'Working prototype required',
        prize: 'Advance to finals',
        allowProjectSubmission: true
      },
      {
        id: 'finals',
        phaseName: 'Finals',
        description: 'Final presentation',
        format: EventFormat.Team,
        type: 'Final Pitch',
        participants: [],
        coreParticipants: [],
        teams: [],
        criteria: [
          {
            title: 'Overall Excellence',
            points: 50,
            role: 'xp_developer'
          }
        ],
        rules: 'Present complete solution',
        prize: '$1000 grand prize',
        allowProjectSubmission: false
      }
    ]
  }
});
```

### Managing Multi-Event Phases

The platform provides a dedicated view for managing multi-events:

**ManageMultiEventView** (`src/views/ManageMultiEventView.vue`):
- View all phases
- Manage phase participants
- Add/remove teams per phase
- Track phase progress
- Select phase winners

```vue
<!-- Example usage -->
<router-link :to="`/events/${eventId}/manage`">
  Manage Multi-Event
</router-link>
```

### Phase Progression

Phases typically follow a progression:

1. **All participants** register for the overall event
2. **Phase 1** starts with all participants
3. **Winners/qualifiers** from Phase 1 move to Phase 2
4. **Continue** until final phase
5. **Final winners** are crowned

**Managing Progression:**
```typescript
// Organizer manually adds qualified participants to next phase
// This is done through the ManageMultiEventView UI
```

### Phase-Specific Features

Each phase maintains its own:
- **Participants list** - Who's in this phase
- **Teams** - Phase-specific team formations
- **Criteria** - Phase-specific rating criteria
- **Submissions** - Phase-specific project submissions
- **Winners** - Phase-specific winners

This allows:
- Different team compositions per phase
- Progressive difficulty
- Phase-specific evaluation
- Flexible competition formats

## Event Status Flow

### Detailed Status Transitions

```typescript
enum EventStatus {
  Pending = 'Pending',     // Initial state, awaiting approval
  Approved = 'Approved',   // Active, accepting participants
  Closed = 'Closed'        // Completed, no new participants
}
```

### Who Can Change Status?

| From → To | Who Can Change | Method |
|-----------|----------------|--------|
| Pending → Approved | Admins | `updateEventStatus()` |
| Pending → Rejected | Admins | `deleteEventRequest()` |
| Approved → Closed | Organizers, Admins | `closeEvent()` |
| Closed → Approved | Admins | `updateEventStatus()` (reopen) |

## Participation

### Joining Events

**Requirements:**
- Event must be Approved
- User must be authenticated
- Event has capacity (if set)

**Process:**
```typescript
// Check if user can join
const canJoin = event.status === EventStatus.Approved;

// Join event
await eventStore.joinEvent(eventId);

// User is added to:
// - event.participants[]
// - event.details.coreParticipants[] (Individual events)
```

### Leaving Events

**Requirements:**
- User must be participant
- Event not yet closed (or organizer allows)

**Process:**
```typescript
await eventStore.leaveEvent(eventId);

// User is removed from:
// - event.participants[]
// - event.details.coreParticipants[]
// - Any teams they're in
```

## Team Management

### Auto-Generation

For Team events, admins can auto-generate teams:

```typescript
await eventStore.autoGenerateTeams(eventId, {
  teamSize: 4,          // Desired team size
  allowPartialTeams: true  // Allow teams smaller than teamSize
});
```

**Algorithm:**
- Shuffles participants randomly
- Distributes into teams of specified size
- Handles remainder participants
- Updates event.teams[]

### Manual Team Management

```typescript
// Add team
const team: Team = {
  id: generateId(),
  teamName: 'Team Alpha',
  members: ['user1', 'user2', 'user3']
};

// Update event with new team
await eventStore.updateEventInStore(eventId, {
  teams: [...existingTeams, team]
});

// Remove member from team
const updatedTeam = {
  ...team,
  members: team.members.filter(m => m !== userToRemove)
};
```

### Team Constraints

```typescript
// From constants.ts
const MIN_TEAM_MEMBERS = 2;  // Minimum per team
const MAX_TEAM_MEMBERS = 8;  // Maximum per team
```

## Submissions

### Submitting Projects

**Requirements:**
- Event must have `allowProjectSubmission: true`
- User must be participant
- Event not past submission deadline

**Individual Event:**
```typescript
await eventStore.submitProject(eventId, {
  projectName: 'My Awesome Project',
  link: 'https://github.com/user/project',
  description: 'A revolutionary app',
  participantId: currentUserId
});
```

**Team Event:**
```typescript
await eventStore.submitProject(eventId, {
  projectName: 'Team Project',
  link: 'https://github.com/team/project',
  description: 'Built by our amazing team',
  teamName: 'Team Alpha',
  participantId: currentUserId  // Submitter
});
```

**MultiEvent Phase:**
```typescript
await eventStore.submitProject(eventId, {
  projectName: 'Phase 2 Submission',
  link: 'https://github.com/team/phase2',
  description: 'Development phase deliverable',
  teamName: 'Team Alpha',
  phaseId: 'development',  // Specify phase
  participantId: currentUserId
});
```

### Viewing Submissions

```typescript
// All submissions for event
const submissions = event.submissions;

// Filter by phase (MultiEvent)
const phaseSubmissions = submissions.filter(s => s.phaseId === 'development');

// Filter by team
const teamSubmissions = submissions.filter(s => s.teamName === 'Team Alpha');
```

## Winner Selection

### Criteria-Based Selection

Events have rating criteria:

```typescript
interface EventCriteria {
  title: string;              // e.g., "Best Innovation"
  points: number;             // XP points awarded
  role: XpCalculationRoleKey; // XP role category
  description?: string;       // Optional description
}
```

### Selecting Winners

**Individual Events:**
```typescript
await submitIndividualWinnerVoteInFirestore(
  eventId,
  criteriaKey,      // e.g., "best-innovation"
  [user1, user2]    // Winner UIDs (can be multiple)
);
```

**Team Events:**
```typescript
await submitTeamCriteriaVoteInFirestore(
  eventId,
  criteriaKey,
  [team1Id, team2Id]  // Winning team IDs
);
```

**MultiEvent Phases:**
```typescript
// Winners are stored per phase
await submitManualWinnerSelectionInFirestore(
  eventId,
  {
    [phaseId]: {
      [criteriaKey]: [winnerId1, winnerId2]
    }
  }
);
```

### XP Distribution

When winners are selected:
1. XP points from criteria are awarded
2. Points distributed to winner(s)
3. Team members share points equally
4. XP records created in xp collection
5. User totalXp updated

## Best Practices

### Event Creation
- Provide clear descriptions
- Set realistic dates
- Define clear criteria
- Specify rules upfront

### Multi-Events
- Plan phase progression carefully
- Consider team continuity vs. reformation
- Balance difficulty across phases
- Set clear advancement criteria

### Team Events
- Set appropriate team sizes
- Allow time for team formation
- Provide collaboration tools
- Consider skill diversity

### Submissions
- Set clear submission requirements
- Provide examples
- Set reasonable deadlines
- Allow resubmissions if needed

### Winner Selection
- Use objective criteria
- Allow voting time
- Consider multiple winners
- Announce results publicly

## Troubleshooting

### Event Not Visible
- Check status (must be Approved/Closed)
- Verify permissions
- Check date filters

### Can't Join Event
- Verify event is Approved
- Check capacity limits
- Ensure user authenticated

### Teams Not Forming
- Verify event format is Team
- Check minimum participants
- Use auto-generation if needed

### Submissions Failing
- Verify allowProjectSubmission is true
- Check submission deadline
- Validate required fields

## Code Examples

See these files for complete implementations:
- `src/services/eventService/` - All event operations
- `src/views/EventDetailsView.vue` - Event participation UI
- `src/views/ManageMultiEventView.vue` - Multi-event management
- `src/views/SelectionView.vue` - Winner selection UI
- `src/views/RequestEventView.vue` - Event creation form

## Next Steps

- Review [Architecture](./architecture.md) for system design
- See [Building Admin Panel](./building-admin-panel.md) for management UI
- Check [Database Setup](./database-setup.md) for data persistence
