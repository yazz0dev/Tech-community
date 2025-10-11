import { type EnrichedUser, type User } from '@/models/user';
import users from '@/data/users.json';
import { type XPData, getDefaultXPData } from '@/types/xp';

/**
 * Fetch a user's profile data
 * @param uid User's UID
 * @returns Promise that resolves with the user data or null
 */
export const fetchStudentData = async (uid: string): Promise<EnrichedUser | null> => {
  const user = users.find(u => u.uid === uid);
  if (!user) {
    return null;
  }
  // In a real scenario, you would fetch XP data from a separate source.
  // For now, we'll use the default XP data.
  const xpData: XPData = getDefaultXPData(uid);
  return Promise.resolve({ ...user, xpData } as EnrichedUser);
};

/**
 * Update a user's profile
 * @param uid User's UID
 * @param updates Profile updates
 * @returns Promise that resolves when update is complete
 */
export const updateStudentProfile = async (
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'email' | 'batchYear' | 'createdAt'>>
): Promise<void> => {
  // This is a mock. In a real scenario, this would update the data source.
  console.log(`Updating profile for ${uid} with`, updates);
  return Promise.resolve();
};

/**
 * Fetch multiple user names by their UIDs
 * @param uids Array of user UIDs
 * @returns Promise that resolves with a map of UIDs to names
 */
export const fetchUserNamesBatch = async (uids: string[]): Promise<Record<string, string>> => {
  const uniqueUids = [...new Set(uids.filter(Boolean))];
  const namesMap: Record<string, string> = {};

  if (uniqueUids.length === 0) {
    return namesMap;
  }

  uniqueUids.forEach(id => {
    const user = users.find(u => u.uid === id);
    namesMap[id] = user?.name || `User (${id.substring(0, 5)})`;
  });

  return Promise.resolve(namesMap);
};

/**
 * Fetch all user profiles
 * @returns Promise that resolves with an array of user data
 */   
export const fetchAllStudentProfiles = async (): Promise<User[]> => {
  return Promise.resolve(users as User[]);
};

/**
 * Fetch all data required for the leaderboard (all users and their XP).
 * @returns Promise that resolves with an array of EnrichedUser.
 */
export const fetchLeaderboardData = async (): Promise<EnrichedUser[]> => {
  const leaderboardUsers = users.map(user => {
    // In a real scenario, you would fetch XP data from a separate source.
    // For now, we'll use the default XP data.
    const xpData: XPData = getDefaultXPData(user.uid);
    return { ...user, xpData };
  });
  return Promise.resolve(leaderboardUsers as EnrichedUser[]);
};