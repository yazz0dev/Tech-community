import { 
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { isFirebaseEnabled, getAuthInstance } from '@/firebase';

/**
 * Initialize the auth service with persistent authentication
 * This should be called as early as possible in the app lifecycle
 */
export const initializeAuth = async (): Promise<void> => {
  if (!isFirebaseEnabled()) {
    // Firebase not enabled, skip auth initialization
    return;
  }
  try {
    // Set persistent authentication to ensure user stays logged in across refreshes
    await setPersistence(getAuthInstance(), browserLocalPersistence);
  } catch (error: unknown) { // Explicitly type error
    console.error('Error initializing auth persistence:', error);
  }
};

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise that resolves with the user credentials
 */
export const signInWithEmail = async (email: string, password: string) => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase Auth is not enabled. Cannot sign in.');
  }
  try {
    return await signInWithEmailAndPassword(getAuthInstance(), email, password);
  } catch (error: unknown) { // Changed from any
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns Promise that resolves when sign out is complete
 */
export const signOutAuth = async () => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase Auth is not enabled. Cannot sign out.');
  }
  try {
    return await signOut(getAuthInstance());
  } catch (error: unknown) { // Changed from any
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param email User's email
 * @returns Promise that resolves when the email is sent
 */
export const sendPasswordResetEmailAuth = async (email: string) => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase Auth is not enabled. Cannot send password reset email.');
  }
  try {
    return await sendPasswordResetEmail(getAuthInstance(), email);
  } catch (error: unknown) { // Changed from any
    console.error('Password reset email error:', error);
    throw error;
  }
};

/**
 * Verify a password reset code
 * @param code Password reset code from the email link
 * @returns Promise that resolves with the user's email if the code is valid
 */
export const verifyPasswordResetCodeAuth = async (code: string) => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase Auth is not enabled. Cannot verify password reset code.');
  }
  try {
    return await verifyPasswordResetCode(getAuthInstance(), code);
  } catch (error: unknown) { // Changed from any
    console.error('Verify password reset code error:', error);
    throw error;
  }
};

/**
 * Confirm a password reset
 * @param code Password reset code
 * @param newPassword New password
 * @returns Promise that resolves when the password is reset
 */
export const confirmPasswordResetAuth = async (code: string, newPassword: string) => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase Auth is not enabled. Cannot confirm password reset.');
  }
  try {
    return await confirmPasswordReset(getAuthInstance(), code, newPassword);
  } catch (error: unknown) { // Changed from any
    console.error('Confirm password reset error:', error);
    throw error;
  }
};
