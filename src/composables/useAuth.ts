import { computed } from 'vue';
import { useProfileStore } from '@/stores/profileStore';
import { useAppStore } from '@/stores/appStore';
import { auth as firebaseAuthInstance } from '@/data/auth';

export function useAuth() {
  const profileStore = useProfileStore();
  const appStore = useAppStore();

  // --- Reactive State ---

  // isAuthenticated is now the definitive check for UI components.
  // It's true only when a Firebase user is authenticated AND their profile data is successfully loaded.
  const isAuthenticated = computed(() => profileStore.isAuthenticated && !!profileStore.currentStudent);

  // Exposes the full, enriched student data object.
  const authUser = computed(() => profileStore.currentStudent);

  // Exposes whether the initial authentication check has completed.
  const isInitialized = computed(() => appStore.hasFetchedInitialAuth);

  // Exposes any errors that occurred during a sign-out attempt.
  const authActionError = computed(() => profileStore.error); // Delegate error handling to store

  // --- Actions ---

  /**
   * Signs out the current user.
   * This action now calls the centralized signOut method in the profile store,
   * which handles both Firebase sign-out and local session cleanup.
   */
  const logout = async (): Promise<void> => {
    try {
      await firebaseAuthInstance.signOut();
      // The onAuthStateChanged listener in main.ts will trigger the profileStore.clearStudentSession.
      // No need to call it directly here.
    } catch (error) {
      console.error("Logout failed in useAuth:", error);
      // The profileStore's error handling will capture and expose this.
    }
  };

  // The global onAuthStateChanged listener in main.ts is now the single source of truth
  // for reacting to auth state changes, which in turn updates the profileStore.

  return {
    isAuthenticated,
    authUser,
    authActionError,
    isInitialized,
    logout,
  };
}