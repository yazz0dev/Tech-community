import { auth } from '@/data/auth';

/**
 * Initialize the auth service with persistent authentication
 * This should be called as early as possible in the app lifecycle
 */
export const initializeAuth = async (): Promise<void> => {
  // This is a mock. In a real scenario, this would initialize the auth service.
  return Promise.resolve();
};

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise that resolves with the user credentials
 */
export const signInWithEmail = async (email: string, password: string) => {
  return auth.signInWithEmailAndPassword(email, password);
};

/**
 * Sign out the current user
 * @returns Promise that resolves when sign out is complete
 */
export const signOutAuth = async () => {
  return auth.signOut();
};

/**
 * Send a password reset email
 * @param email User's email
 * @returns Promise that resolves when the email is sent
 */
export const sendPasswordResetEmailAuth = async (email: string) => {
  return auth.sendPasswordResetEmail(email);
};

/**
 * Verify a password reset code
 * @param code Password reset code from the email link
 * @returns Promise that resolves with the user's email if the code is valid
 */
export const verifyPasswordResetCodeAuth = async (code: string) => {
  // This is a mock. In a real scenario, this would verify a password reset code.
  console.log(`Verifying password reset code ${code}`);
  return Promise.resolve('test@example.com');
};

/**
 * Confirm a password reset
 * @param code Password reset code
 * @param newPassword New password
 * @returns Promise that resolves when the password is reset
 */
export const confirmPasswordResetAuth = async (code: string, newPassword: string) => {
  // This is a mock. In a real scenario, this would confirm a password reset.
  console.log(`Confirming password reset with code ${code}`);
  return Promise.resolve();
};