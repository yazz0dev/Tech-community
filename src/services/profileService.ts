import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  documentId, 
  updateDoc, 
  Timestamp
} from 'firebase/firestore';
import { getFirestoreInstance, getAuthInstance, isFirebaseEnabled } from '@/firebase';
import type { EnrichedStudentData, UserData } from '@/types/student';
import type { XPData } from '@/types/xp';
import { getDefaultXPData } from '@/types/xp';
import { deepClone } from '@/utils/eventUtils';
import { STUDENTS_COLLECTION, XP_COLLECTION } from '@/utils/constants';

const now = () => Timestamp.now();

/**
 * Fetch a student's profile data
 * @param uid Student's UID
 * @returns Promise that resolves with the student data or null
 */
export const fetchStudentData = async (uid: string): Promise<EnrichedStudentData | null> => {
  try {
    const studentDocRef = doc(getFirestoreInstance(), STUDENTS_COLLECTION, uid);
    const xpDocRef = doc(getFirestoreInstance(), XP_COLLECTION, uid);

    const [studentSnap, xpSnap] = await Promise.all([
      getDoc(studentDocRef),
      getDoc(xpDocRef)
    ]);

    if (!studentSnap.exists()) {
      console.warn(`Student profile for UID ${uid} not found in Firestore 'students' collection.`);
      return null;
    }

    const studentDocData = studentSnap.data();
    const studentData = { uid: studentSnap.id, ...studentDocData } as UserData;
    const xpData = xpSnap.exists() ? { uid: xpSnap.id, ...xpSnap.data() } as XPData : getDefaultXPData(uid);

    const enrichedData: EnrichedStudentData = {
      uid: studentData.uid,
      name: studentData.name ?? null,
      email: studentData.email ?? null,
      studentId: studentData.studentId,
      batchYear: studentData.batchYear,
      batch: studentData.batch,
      photoURL: studentData.photoURL ?? null,
      bio: studentData.bio,
      skills: studentData.skills,
      hasLaptop: studentData.hasLaptop,
      socialLinks: studentData.socialLinks,
      xpData: deepClone(xpData)
    };
    return enrichedData;
  } catch (err) {
    console.error(`Error fetching student data for UID ${uid}:`, err);
    throw err;
  }
};

/**
 * Update a student's profile
 * @param uid Student's UID
 * @param updates Profile updates
 * @returns Promise that resolves when update is complete
 */
export const updateStudentProfile = async (
  uid: string,
  updates: Partial<Omit<UserData, 'uid' | 'email' | 'batchYear' | 'createdAt'>>
): Promise<void> => {
  try {
    // Ensure the current user is authenticated
    // Using centralized auth instance from firebase.ts
    if (!isFirebaseEnabled()) {
      throw new Error('Firebase is not enabled');
    }
    const auth = getAuthInstance();
    if (!auth.currentUser) {
      throw new Error('You must be authenticated to update your profile');
    }

    // Error('User ID is required for profile updates');
    if (!uid) {
      throw new Error('User ID is required for profile updates');
    }

    if (auth.currentUser.uid !== uid) {
      throw new Error('You do not have permission to update this profile. Please try logging out and back in.');
    }

    const studentRef = doc(getFirestoreInstance(), STUDENTS_COLLECTION, uid);
    const dataToUpdate = { ...updates, lastUpdatedAt: now() };
    await updateDoc(studentRef, dataToUpdate);
  } catch (err: unknown) {
    // More specific error handling for permission issues
    if (err && typeof err === 'object' && 'code' in err && err.code === 'permission-denied') {
      throw new Error('You do not have permission to update this profile. Please try logging out and back in.');
    } else {
      console.error("Error updating student profile:", err);
      throw err;
    }
  }
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

  try {
    for (let i = 0; i < uniqueUids.length; i += 30) {
      const batchIds = uniqueUids.slice(i, i + 30);
      if (batchIds.length === 0) continue;
      
      const usersRef = collection(getFirestoreInstance(), STUDENTS_COLLECTION);
      const q = query(usersRef, where(documentId(), 'in', batchIds));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(docSnap => {
        const nameVal = docSnap.data()?.name || `Student (${docSnap.id.substring(0, 5)})`;
        namesMap[docSnap.id] = nameVal;
      });
    }

    // Add placeholders for missing IDs
    uniqueUids.forEach(id => {
      if (!namesMap[id]) {
        namesMap[id] = `Student (${id.substring(0, 5)})`;
      }
    });

    return namesMap;
  } catch (err) {
    console.error("Error fetching user names batch:", err);
    throw err;
  }
};

/**
 * Fetch all student profiles
 * @returns Promise that resolves with an array of user data
 */   
export const fetchAllStudentProfiles = async (): Promise<UserData[]> => {
  try {
    const studentsCollectionRef = collection(getFirestoreInstance(), STUDENTS_COLLECTION);
    const q = query(studentsCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const fetchedUsers: UserData[] = [];
    querySnapshot.forEach((docSnap) => {
      const userData = { uid: docSnap.id, ...docSnap.data() } as UserData;
      fetchedUsers.push(userData);
    });
    return fetchedUsers;
  } catch (err) {
    console.error("Error fetching all student profiles:", err);
    throw err;
  }
};

/**
 * Fetch all data required for the leaderboard (all students and their XP).
 * @returns Promise that resolves with an array of EnrichedStudentData.
 */
export const fetchLeaderboardData = async (): Promise<EnrichedStudentData[]> => {
  try {
    const studentsCollectionRef = collection(getFirestoreInstance(), STUDENTS_COLLECTION);
    const studentsSnapshot = await getDocs(studentsCollectionRef);
    
    if (studentsSnapshot.empty) {
      return []; // No students found
    }

    const leaderboardUsersPromises = studentsSnapshot.docs.map(async (studentDoc) => {
      const studentData = { uid: studentDoc.id, ...studentDoc.data() } as UserData;
      const xpDocRef = doc(getFirestoreInstance(), XP_COLLECTION, studentDoc.id);
      const xpSnap = await getDoc(xpDocRef);
      const xpData = xpSnap.exists()
        ? ({ uid: xpSnap.id, ...xpSnap.data() } as XPData)
        : getDefaultXPData(studentDoc.id);

      // Construct EnrichedStudentData carefully, similar to fetchStudentData
      return {
        uid: studentData.uid,
        name: studentData.name ?? null,
        email: studentData.email ?? null,
        studentId: studentData.studentId,
        batchYear: studentData.batchYear,
        batch: studentData.batch,
        photoURL: studentData.photoURL ?? null,
        bio: studentData.bio,
        skills: studentData.skills,
        hasLaptop: studentData.hasLaptop,
        socialLinks: studentData.socialLinks,
        xpData: deepClone(xpData)
      } as EnrichedStudentData;
    });

    const enrichedUsers = await Promise.all(leaderboardUsersPromises);
    return enrichedUsers;
  } catch (err) {
    console.error("Error fetching leaderboard data:", err);
    throw err; // Re-throw for the store to handle
  }
};
