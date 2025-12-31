import { doc, getDoc, serverTimestamp, Timestamp, updateDoc, increment as firebaseIncrement } from 'firebase/firestore'; // Removed unused collection, query, where, getDocs. Added Timestamp, updateDoc, firebaseIncrement
import { getFirestoreInstance, isFirebaseEnabled } from '@/firebase';
import { SIGNUP_LINKS_COLLECTION, SIGNUP_COLLECTION, STUDENTS_COLLECTION } from './constants';
import type { RegistrationFormData, BatchSignupConfig, signup } from '@/types/signup';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

/**
 * Helper function to get Firestore instance with error handling
 */
function getDb() {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase is not enabled. Signup functionality requires Firebase.');
  }
  return getFirestoreInstance();
}

/**
 * Validate batch year
 */
export function isValidBatchYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= currentYear + 5;
}

/**
 * Parse signup link parameters
 */
export function parseSignupParams(searchParams: URLSearchParams): {
  batchYear: number | null;
  token: string | null;
  isValid: boolean;
} {
  const batch = searchParams.get('batch');
  const token = searchParams.get('token');

  let batchYear: number | null = null;
  let isValid = false;

  if (batch) {
    const year = parseInt(batch);
    if (!isNaN(year) && isValidBatchYear(year)) {
      batchYear = year;
      isValid = true;
    }
  }

  if (token && typeof token === 'string' && token.length > 0) {
    isValid = true;
  }

  return {
    batchYear,
    token,
    isValid
  };
}

/**
 * Validate a token-based signup link
 */
export async function validateSignupToken(token: string): Promise<{
  isValid: boolean;
  batchYear?: number;
  error?: string;
}> {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Token is invalid or missing.' };
  }

  try {
    const linkDocRef = doc(getDb(), SIGNUP_LINKS_COLLECTION, token);
    const linkDoc = await getDoc(linkDocRef);

    if (!linkDoc.exists()) { // Check if the document exists
      return { isValid: false, error: 'Signup token not found.' };
    }

    const linkData = linkDoc.data(); // Safe to call data() now

    if (!linkData.isActive) {
      return { isValid: false, error: 'Signup token is no longer active.' };
    }

    if (linkData.expiresAt && serverTimestamp() > linkData.expiresAt) { // Compare with serverTimestamp if expiresAt is a Timestamp
      return { isValid: false, error: 'Signup token has expired.' };
    }
    
    // Check if the associated batch year is active
    if (linkData.batchYear) {
        const batchIsActive = await isBatchSignupActive(linkData.batchYear);
        if (!batchIsActive) {
            return { isValid: false, error: `Signup for batch ${linkData.batchYear} (associated with this token) is not active.` };
        }
    } else {
        return { isValid: false, error: 'Token is not associated with a valid batch year.' };
    }

    return { isValid: true, batchYear: linkData.batchYear };
  } catch (error) {
    console.error('Error validating signup token:', error);
    return { isValid: false, error: 'An error occurred while validating the token.' };
  }
}

/**
 * Check if batch signup is active
 */
export async function isBatchSignupActive(batchYear: number): Promise<boolean> {
  try {
    const batchConfigDocRef = doc(getDb(), SIGNUP_COLLECTION, String(batchYear));
    const batchConfigSnap = await getDoc(batchConfigDocRef); 
    
    if (!batchConfigSnap.exists()) { 
        console.warn(`Batch config for year ${batchYear} not found.`);
        return false; 
    }
    
    const configData = batchConfigSnap.data() as BatchSignupConfig; // Use BatchSignupConfig type
    return configData?.active === true; 
  } catch (error) {
    console.error(`Error checking if batch signup is active for ${batchYear}:`, error);
    return false; // Default to false on error
  }
}

/**
 * Get batch signup configuration
 */
export async function getBatchSignupConfig(batchYear: number): Promise<(BatchSignupConfig & { id: string }) | null> {
  try {
    const batchDocRef = doc(getDb(), SIGNUP_COLLECTION, batchYear.toString()); // Use SIGNUP_COLLECTION constant
    const batchDoc = await getDoc(batchDocRef);
    
    if (!batchDoc.exists()) {
      return null;
    }
    
    // Ensure that batchDoc.data() conforms to BatchSignupConfig and combine with id
    return { id: batchDoc.id, ...(batchDoc.data() as BatchSignupConfig) } as (BatchSignupConfig & { id: string });
  } catch (error) {
    console.error('Error getting batch signup config:', error);
    return null;
  }
}

/**
 * Get the collection path for registrations in a specific batch
 */
export function getBatchRegistrationsPath(batchYear: number): string {
  return `signup/${batchYear}`;
}

/**
 * Format signup link for display
 */
export function formatSignupLinkForDisplay(
  batchYear: number,
  token?: string,
  baseUrl: string = window.location.origin
): string {
  const url = new URL(baseUrl);
  url.pathname = `/signup/${batchYear}`;
  
  if (token) {
    url.searchParams.set('token', token);
  }
  
  return url.toString();
}

/**
 * Increments the registration count for a given batch year.
 * @param batchYear The batch year (e.g., 2023).
 */
export async function incrementBatchRegistrationCount(batchYear: number): Promise<void> {
  if (!isValidBatchYear(batchYear)) {
    console.error(`Invalid batch year provided for incrementing count: ${batchYear}`);
    return;
  }
  try {
    const batchConfigDocRef = doc(getDb(), SIGNUP_COLLECTION, String(batchYear));
    // Ensure the document exists before trying to increment
    const docSnap = await getDoc(batchConfigDocRef);
    if (!docSnap.exists()) {
        // Optionally, create the batch config document if it doesn't exist,
        // or log an error and return. For now, logging error.
        console.error(`Batch config document for year ${batchYear} does not exist. Cannot increment count.`);
        // Or, you could initialize it here if that's the desired behavior:
        // await setDoc(batchConfigDocRef, { /* initial BatchSignupConfig data */ });
        return;
    }

    await updateDoc(batchConfigDocRef, {
      currentRegistrations: firebaseIncrement(1), // Use firebaseIncrement
      updatedAt: serverTimestamp(),
      // updatedBy: 'SYSTEM' // Or pass the UID of the user performing the action if available
    });
  } catch (error) {
    console.error(`Error incrementing registration count for batch ${batchYear}:`, error);
    // Potentially re-throw or handle more gracefully
    throw error;
  }
}

export async function checkExistingRegistration(email: string): Promise<{ registered: boolean; studentId?: string }> {
  try {
    const studentsCollection = collection(getDb(), STUDENTS_COLLECTION);
    const q = query(studentsCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const studentDoc = querySnapshot.docs[0]!;
      return { registered: true, studentId: studentDoc.data().studentId || '' };
    }
    return { registered: false };
  } catch (error) {
    console.error("Error checking for existing registration:", error);
    return { registered: false };
  }
}

export async function submitRegistration(
  formData: Omit<RegistrationFormData, 'agreeTerms'>,
  activeConfig: BatchSignupConfig
): Promise<string> {
  const newRegistration: Omit<signup, 'id' | 'status' | 'submittedAt'> = {
    fullName: formData.fullName,
    email: formData.email,
    studentId: formData.studentId,
    batchYear: activeConfig.batchYear,
    hasLaptop: formData.hasLaptop ?? false,
    bio: formData.bio,
    signupSource: {
      batch: activeConfig.batchYear,
      userAgent: navigator.userAgent,
    },
  };

  const docRef = await addDoc(collection(getDb(), SIGNUP_COLLECTION, String(activeConfig.batchYear), 'signup'), {
    ...newRegistration,
    status: 'pending_approval',
    submittedAt: Timestamp.now(),
  });

  return docRef.id;
}