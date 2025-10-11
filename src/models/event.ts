// src/models/event.ts

import type { XpCalculationRoleKey } from '@/types/xp';

// --- Enums ---
export enum EventStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Closed = 'Closed'
}

export enum EventFormat {
  Individual = 'Individual',
  Team = 'Team',
  MultiEvent = 'MultiEvent'
}

// --- Supporting Interfaces ---

export interface EventPhase {
  id: string;
  phaseName: string;
  description: string;
  format: EventFormat.Individual | EventFormat.Team;
  type: string;

  participants: string[];
  coreParticipants: string[];

  criteria: EventCriteria[];
  teams: Team[];

  rules: string | null;
  prize: string | null;
  allowProjectSubmission: boolean;

  winners?: Record<string, string[]> | null;
}

export interface EventDate {
  start: string | null;
  end: string | null;
}

export interface EventGalleryItem {
  url: string;
  caption?: string | null;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
}

export interface EventDetails {
  eventName: string;
  description: string;
  format: EventFormat;
  isCompetition?: boolean;
  organizers: string[];
  coreParticipants: string[];
  type?: string;
  date: EventDate;
  rules?: string | null;
  prize?: string | null;
  allowProjectSubmission: boolean;

  phases?: EventPhase[] | null;
}

export interface EventCriteria {
  description?: string | null | undefined;
  constraintIndex: number;
  title: string;
  constraintKey?: string;
  points: number;
  role: XpCalculationRoleKey | 'xp_developer' | 'xp_designer' | 'xp_presenter' | 'xp_problemSolver' | string;
  targetRole?: string;
}

export interface Submission {
  projectName: string;
  link: string;
  submittedBy: string;
  submittedAt: string;
  description?: string | null | undefined;
  participantId?: string | null;
  teamName?: string;
  phaseId?: string | null;
}

export interface Team {
  id: string | undefined;
  teamName: string;
  members: string[];
  teamLead: string | undefined;
}

export interface OrganizerRating {
  userId: string;
  rating: number;
  feedback?: string | null;
  ratedAt: string | null;
}

export interface EventLifecycleTimestamps {
  createdAt?: string | null | undefined;
  approvedAt?: string | null;
  startedAt?: string | null;
  rejectedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  closedAt?: string | null;
}

export interface GalleryItem {
  url: string;
  addedBy: string;
  description?: string;
}

// --- Main Event Interface ---
export interface Event {
  id: string;
  details: EventDetails;
  status: EventStatus;
  requestedBy: string;
  votingOpen: boolean;
  lastUpdatedAt?: string | null | undefined;
  participants?: string[] | null | undefined;
  submissions?: Submission[] | null | undefined;
  criteria?: EventCriteria[] | null | undefined;
  teams?: Team[] | null | undefined;
  organizerRatings?: Record<string, OrganizerRating> | null | undefined;
  winners?: Record<string, string[]> | null | undefined;

  criteriaVotes?: Record<string, Record<string, string>> | null | undefined;
  bestPerformerSelections?: Record<string, string> | null | undefined;

  rejectionReason?: string | null | undefined;
  manuallySelectedBy?: string | null | undefined;
  gallery?: EventGalleryItem[] | null | undefined;
  lifecycleTimestamps?: EventLifecycleTimestamps | null | undefined;
  teamMemberFlatList?: string[] | null | undefined;

  xpAwardingStatus?: 'pending' | 'in_progress' | 'completed' | 'failed' | null | undefined;
  xpAwardedAt?: string | null | undefined;
  xpAwardError?: string | null | undefined;
}