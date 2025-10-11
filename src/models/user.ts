// src/models/user.ts

import type { XPData } from '@/types/xp';

export interface SocialLinks {
  primary?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  instagram?: string;
}

export interface User {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  batch?: string;
  batchYear?: number;
  studentId?: string;
  bio?: string;
  skills?: string[];
  hasLaptop?: boolean;

  socialLinks?: SocialLinks;

  createdAt?: string;
  lastLogin?: string;
  profileUpdatedAt?: string;
  lastUpdatedAt?: string;
}

export interface EnrichedUser extends User {
  xpData: XPData | null;
}