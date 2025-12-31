// src/stores/studentProfileStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User as FirebaseUser } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { isFirebaseEnabled, getAuthInstance } from '@/firebase';
import { deepClone, isEmpty } from '@/utils/eventUtils';
import { useNotificationStore } from './notificationStore';
import { useAppStore } from './appStore'; // Renamed to studentAppStore for clarity in this file
import type { EnrichedStudentData, StudentEventHistoryItem, UserData, StudentPortfolioGenerationData } from '@/types/student'; // Adjusted imports: Removed StudentData, Changed StudentPortfolioData
import { type Event } from '@/types/event'; // Added Event and EventStatus, EventFormat
import type { NameCacheEntry, StudentPortfolioProject } from '@/types/student'; // Removed ImageUploadOptions, ImageUploadState, UploadStatusValue
// import { UploadStatus } from '@/types/student'; // Removed UploadStatus enum - Not needed anymore
import { handleAuthError as formatAuthErrorUtil, handleFirestoreError as formatFirestoreErrorUtil } from '@/utils/errorHandlers';
import { 
    fetchStudentData as fetchStudentDataService,
    updateStudentProfile as updateStudentProfileService,
    fetchUserNamesBatch as fetchUserNamesBatchService,
    fetchAllStudentProfiles as fetchAllStudentProfilesService,
    fetchLeaderboardData as fetchLeaderboardDataService,
} from '@/services/profileService';
import {
    fetchStudentPortfolioProjects as fetchStudentPortfolioProjectsService,
    fetchStudentEventHistory as fetchStudentEventHistoryService,
    fetchComprehensivePortfolioData as fetchComprehensivePortfolioDataService
} from '@/services/portfolioService';
import { fetchMyEventRequests as fetchStudentEventRequestsService } from '@/services/eventService/eventQueries';
import { fetchStudentEventsWithFallback } from '@/services/eventService/eventQueries'; // Updated import
import { constructGitHubAvatarUrl } from '@/services/avatarService'; // Updated avatar service import
// import { uploadFileService, deleteFileByUrlService, getOptimizedImageUrl } from '@/services/storageService'; // Removed storage service imports

// const STUDENT_COLLECTION_PATH = 'students';
// const XP_COLLECTION_PATH = 'xp';

// Get storage reference from the existing Firebase app

const NAME_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const useProfileStore = defineStore('studentProfile', () => {
  const notificationStore = useNotificationStore();
  const studentAppStore = useAppStore();

  const currentStudent = ref<EnrichedStudentData | null>(null);
  const viewedStudentProfile = ref<EnrichedStudentData | null>(null);
  const viewedStudentProjects = ref<StudentPortfolioProject[]>([]);
  const viewedStudentEventHistory = ref<StudentEventHistoryItem[]>([]);
  const currentUserPortfolioData = ref<{ 
    projects: StudentPortfolioProject[]; 
    eventParticipationCount: number;
    comprehensiveData?: StudentPortfolioGenerationData;
  }>({ 
    projects: [], 
    eventParticipationCount: 0 
  });
  const allUsers = ref<UserData[]>([]);
  const nameCache = ref<Map<string, NameCacheEntry>>(new Map());
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const actionError = ref<string | null>(null);
  const fetchError = ref<string | null>(null);
  const userRequests = ref<Event[]>([]);
  const isLoadingUserRequests = ref<boolean>(false);
  const hasFetched = ref<boolean>(false);

  // --- Getters ---
  const studentId = computed(() => currentStudent.value?.uid || null);
  const studentName = computed(() => currentStudent.value?.name || 'Student');
  const studentBatchYear = computed(() => currentStudent.value?.batchYear || null);
  const studentXP = computed(() => currentStudent.value?.xpData?.totalCalculatedXp || 0);
  const currentStudentPhotoURL = computed(() => currentStudent.value?.photoURL || null);
  const isAuthenticated = computed(() => !!currentStudent.value?.uid);
  const getAllUsers = computed(() => allUsers.value);

  const getCachedStudentName = (uid: string): string | undefined => {
    const entry = nameCache.value.get(uid);
    if (entry && (Date.now() - entry.timestamp < NAME_CACHE_TTL)) {
      return entry.name;
    }
    return undefined;
  };

  function _updateNameCache(uid: string, name: string | null) {
    if (name) {
      nameCache.value.set(uid, { name, timestamp: Date.now() });
    } else {
      nameCache.value.delete(uid);
    }
  }

  async function _handleAuthError(operation: string, err: unknown, _uid?: string): Promise<void> {
    const formattedMessage = formatAuthErrorUtil(err);
    let finalMessage: string;

    if (formattedMessage === 'An authentication error occurred. Please try again.' || 
        (err instanceof Error && formattedMessage === err.message && (err.message.toLowerCase().includes("unknown") || err.message.toLowerCase().includes("error occurred")))) {
      finalMessage = err instanceof Error ? `${operation}: ${err.message}` : `An unknown error occurred during ${operation}.`;
    } else {
      finalMessage = formattedMessage;
    }
    
    error.value = finalMessage;
    notificationStore.showNotification({ message: finalMessage, type: 'error' });
  }

  async function _handleOpError(operation: string, err: unknown, _uid?: string): Promise<void> {
    let finalMessage: string;

    if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
        const formattedMessage = formatFirestoreErrorUtil(err); 
        if (formattedMessage === 'An unknown error occurred.' || formattedMessage === 'The service is currently unavailable. Please try again later.') {
            finalMessage = err instanceof Error ? `${operation}: ${err.message}` : `An error occurred during ${operation}. Details: ${formattedMessage}`;
        } else {
            finalMessage = formattedMessage;
        }
    } else if (err instanceof Error) {
        finalMessage = `${operation}: ${err.message}`;
    } else {
        finalMessage = `An unknown error occurred during ${operation}.`;
    }
    
    actionError.value = finalMessage;
    notificationStore.showNotification({ message: finalMessage, type: 'error' });
  }

  async function _handleFetchError(operation: string, err: unknown): Promise<void> {
    let finalMessage: string;

    if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
        const formattedMessage = formatFirestoreErrorUtil(err);
        if (formattedMessage === 'An unknown error occurred.' || formattedMessage === 'The service is currently unavailable. Please try again later.') {
            finalMessage = err instanceof Error ? `${operation}: ${err.message}` : `An error occurred during ${operation}. Details: ${formattedMessage}`;
        } else {
            finalMessage = formattedMessage;
        }
    } else if (err instanceof Error) {
        finalMessage = `${operation}: ${err.message}`;
    } else {
        finalMessage = `An unknown error occurred during ${operation}.`;
    }
    fetchError.value = finalMessage;
  }

  async function handleAuthStateChange(firebaseUser: FirebaseUser | null) {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;
    actionError.value = null;
    fetchError.value = null;
    
    if (firebaseUser) {
      try {
        const enrichedData = await fetchStudentDataService(firebaseUser.uid);
        
        if (enrichedData) {
          // Attempt to fetch and update GitHub avatar
          const githubUsername = enrichedData.socialLinks?.github;
          if (githubUsername) {
            const constructedAvatarUrl = constructGitHubAvatarUrl(githubUsername);
            if (constructedAvatarUrl && constructedAvatarUrl !== enrichedData.photoURL) {
              try {
                // Update Firestore and local state
                await updateStudentProfileService(firebaseUser.uid, { photoURL: constructedAvatarUrl });
                enrichedData.photoURL = constructedAvatarUrl;
                notificationStore.showNotification({ message: 'GitHub avatar updated.', type: 'info', duration: 2000 });
              } catch (dbError) {
                console.warn('Failed to update GitHub avatar in Firestore on auth state change:', dbError);
                // Proceed with locally fetched (but not saved) URL or let letter avatar handle it
                // enrichedData.photoURL will still be updated locally for this session if db write fails.
              }
            } else if (constructedAvatarUrl) {
                enrichedData.photoURL = constructedAvatarUrl; // Ensure local data has it even if same or not updated in DB
            }
          }
          currentStudent.value = enrichedData;
          _updateNameCache(enrichedData.uid, enrichedData.name ?? null);
          await fetchCurrentUserPortfolioData();
          hasFetched.value = true;
        } else {
          currentStudent.value = null;
          hasFetched.value = true;
          notificationStore.showNotification({ 
            message: "Authentication successful, but no student profile was found. Please contact an admin to have your account set up.",
            type: 'warning',
            duration: 10000
          });
          error.value = "Student profile not found for authenticated user.";
        }
      } catch (err) {
        console.error('Error fetching student data after auth change:', err);
        await _handleAuthError("fetching student data after auth change", err, firebaseUser.uid);
        currentStudent.value = null;
        hasFetched.value = true;
        notificationStore.showNotification({ 
          message: "We couldn't load your profile due to a permissions error. Please contact an admin.",
          type: 'error',
          duration: 10000
        });
      }
    } else {
      await clearStudentSession(false);
    }
    
    isLoading.value = false;
    
    if (!studentAppStore.hasFetchedInitialAuth) {
      studentAppStore.setHasFetchedInitialAuth(true);
    }
    
    if (currentStudent.value && allUsers.value.length === 0) {
      try {
        await fetchAllStudentProfiles();
      } catch (err) {
        console.warn('Error fetching all student profiles:', err);
      }
    }
  }

  async function fetchMyProfile(): Promise<EnrichedStudentData | null> {
    if (!studentId.value) {
      error.value = "User not authenticated. Cannot fetch profile.";
      currentStudent.value = null;
      return null;
    }
    isLoading.value = true;
    error.value = null;
    actionError.value = null;
    try {
      const enrichedData = await fetchStudentDataService(studentId.value);
      if (enrichedData) {
        const githubUsername = enrichedData.socialLinks?.github;
        let updatedPhotoURL = enrichedData.photoURL; // Start with existing photoURL

        if (githubUsername) {
          const constructedAvatarUrl = constructGitHubAvatarUrl(githubUsername);
          if (constructedAvatarUrl && constructedAvatarUrl !== enrichedData.photoURL) {
            try {
              // Update Firestore and prepare to update local state
              await updateStudentProfileService(studentId.value, { photoURL: constructedAvatarUrl });
              updatedPhotoURL = constructedAvatarUrl; // Mark for local update
              notificationStore.showNotification({ message: 'GitHub avatar updated.', type: 'info', duration: 2000 });
            } catch (dbError) {
               console.warn('Failed to update GitHub avatar in Firestore on fetchMyProfile:', dbError);
               updatedPhotoURL = constructedAvatarUrl; // Still use it locally for this session
            }
          } else if (constructedAvatarUrl) {
            updatedPhotoURL = constructedAvatarUrl; // Ensure local state has it even if same as DB
          }
        }

        // Apply updated photoURL to the local copy before cloning
        const profileDataForStore = { ...enrichedData, photoURL: updatedPhotoURL };
        currentStudent.value = deepClone(profileDataForStore);
        _updateNameCache(currentStudent.value.uid, currentStudent.value.name ?? null);
        hasFetched.value = true;
        return currentStudent.value;
      } else {
        error.value = "Failed to fetch profile data. Profile not found for UID: " + studentId.value;
        notificationStore.showNotification({ message: error.value, type: 'error' });
        currentStudent.value = null;
        return null;
      }
    } catch (err) {
      await _handleOpError("fetching own profile", err, studentId.value);
      currentStudent.value = null;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUserRequests(userId: string): Promise<void> {
    isLoadingUserRequests.value = true;
    fetchError.value = null;
    userRequests.value = [];

    try {
      const fetchedRequestsFromService = await fetchStudentEventRequestsService(userId);
      userRequests.value = fetchedRequestsFromService;
    } catch (err) {
      await _handleFetchError("fetching user event requests", err);
      userRequests.value = [];
    } finally {
      isLoadingUserRequests.value = false;
    }
  }

  function removeUserRequestById(eventId: string): void {
    userRequests.value = userRequests.value.filter(request => request.id !== eventId);
  }

  async function clearStudentSession(performFirebaseSignOut: boolean = false) {
    if (performFirebaseSignOut && isFirebaseEnabled()) {
        const authInstance = getAuthInstance();
        if (authInstance.currentUser) {
            try {
                await firebaseSignOut(authInstance);
            } catch (e: unknown) {
                // Silently handle sign out errors
            }
        }
    }
    currentStudent.value = null;
    viewedStudentProfile.value = null;
    viewedStudentProjects.value = [];
    viewedStudentEventHistory.value = [];
    currentUserPortfolioData.value = { projects: [], eventParticipationCount: 0 };
    userRequests.value = [];
    hasFetched.value = false;
  }

  async function studentSignOut() {
    isLoading.value = true;
    try {
      await clearStudentSession(false);
    } catch (err: unknown) {
      await _handleAuthError("clearing student session on sign out", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function updateMyProfile(updates: Partial<Omit<UserData, 'uid' | 'email' | 'createdAt' | 'xpData' | 'lastLogin' | 'profileUpdatedAt'>>) {
    if (!studentId.value) {
      notificationStore.showNotification({ message: "You must be logged in to update your profile.", type: 'error'});
      return false;
    }
    isLoading.value = true; actionError.value = null;

    const updatesToPersist = { ...updates };

    try {
      const currentGithubUsername = currentStudent.value?.socialLinks?.github;
      const newGithubUsername = updates.socialLinks?.github;

      // Check if GitHub username is present in the updates and has changed or is newly added
      if (newGithubUsername !== undefined && newGithubUsername !== currentGithubUsername) {
        if (newGithubUsername && newGithubUsername.trim() !== '') {
          const constructedAvatarUrl = constructGitHubAvatarUrl(newGithubUsername.trim());
          // constructedAvatarUrl will be non-null if newGithubUsername is non-empty
          updatesToPersist.photoURL = constructedAvatarUrl;
          notificationStore.showNotification({ message: 'GitHub avatar updated based on new username.', type: 'info', duration: 2500 });
        } else {
          // GitHub username is being explicitly cleared
          updatesToPersist.photoURL = null;
          notificationStore.showNotification({ message: 'GitHub username removed. Profile image cleared.', type: 'info', duration: 2500 });
        }
      }
      // Note: If newGithubUsername is undefined (i.e., socialLinks.github was not in `updates`),
      // photoURL is not changed by this block, preserving existing photoURL unless explicitly cleared above.

      // Call the service function to update the backend
      await updateStudentProfileService(studentId.value, updatesToPersist);

      if (currentStudent.value) {
        // Create a new object for currentStudent to ensure reactivity
        // Ensure updatesToPersist is used here as it may contain the new photoURL
        const updatedStudentData = { ...currentStudent.value };

        // Apply updates to the local copy
        for (const key in updatesToPersist) {
          if (Object.prototype.hasOwnProperty.call(updatesToPersist, key)) {
            // Type assertion as updatesToPersist can have various keys from UserData
            (updatedStudentData as any)[key] = (updatesToPersist as any)[key];
          }
        }
        
        currentStudent.value = deepClone(updatedStudentData);

        // Check if name was part of the original updates, not updatesToPersist specifically for name cache
        if (updates.name !== undefined) {
          _updateNameCache(studentId.value, updates.name ?? null);
        }
      }
      notificationStore.showNotification({ message: "Profile updated successfully!", type: 'success' });
      return true;
    } catch (err) {
      await _handleOpError("updating profile", err, studentId.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProfileForView(targetStudentId: string): Promise<EnrichedStudentData | null> {
    isLoading.value = true; fetchError.value = null;
    viewedStudentProfile.value = null;
    viewedStudentProjects.value = [];
    viewedStudentEventHistory.value = [];

    try {
      const enrichedData = await fetchStudentDataService(targetStudentId);
      if (enrichedData) {
        let profileDataForView = { ...enrichedData };
        const githubUsername = profileDataForView.socialLinks?.github;

        if (githubUsername) {
          const constructedAvatarUrl = constructGitHubAvatarUrl(githubUsername);
          if (constructedAvatarUrl) {
            // Only update the local view model, DO NOT save to other user's Firestore record
            profileDataForView.photoURL = constructedAvatarUrl;
          }
          // No catch needed here as constructGitHubAvatarUrl is synchronous and doesn't throw for this usage
        }

        viewedStudentProfile.value = profileDataForView;
        _updateNameCache(profileDataForView.uid, profileDataForView.name ?? null);

        const projects = await fetchStudentPortfolioProjectsService(targetStudentId);
        viewedStudentProjects.value = projects;

        const history = await fetchStudentEventHistoryService(targetStudentId);
        viewedStudentEventHistory.value = history;
        
        return enrichedData;
      } else {
        fetchError.value = "Profile not found.";
        notificationStore.showNotification({message: fetchError.value, type: 'warning'});
        return null;
      }
    } catch (err) {
      await _handleFetchError("fetching profile for view", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCurrentUserPortfolioData() {
    if (!studentId.value) {
      currentUserPortfolioData.value = { projects: [], eventParticipationCount: 0 };
      return;
    }
    isLoading.value = true;
    try {
      const studentProfile = currentStudent.value;
      if (!studentProfile) throw new Error("Current student profile not loaded.");

      const studentEvents = await fetchStudentEventsWithFallback(studentProfile.uid);
      currentUserPortfolioData.value.eventParticipationCount = studentEvents.length;

      try {
        const projects = await fetchStudentPortfolioProjectsService(studentProfile.uid);
        currentUserPortfolioData.value.projects = projects;
      } catch (projectError) {
        console.warn("Failed to fetch portfolio projects, using empty array:", projectError);
        currentUserPortfolioData.value.projects = [];
      }

    } catch (err) {
      await _handleOpError("fetching current user portfolio data", err, studentId.value);
      currentUserPortfolioData.value = { projects: [], eventParticipationCount: 0 };
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCurrentUserComprehensivePortfolioData(): Promise<StudentPortfolioGenerationData | null> {
    if (!studentId.value) {
      return null;
    }
    isLoading.value = true;
    try {
      const studentProfile = currentStudent.value;
      if (!studentProfile) throw new Error("Current student profile not loaded.");

      try {
        const comprehensiveData = await fetchComprehensivePortfolioDataService(studentProfile.uid);
        currentUserPortfolioData.value.comprehensiveData = comprehensiveData;
        return comprehensiveData;
      } catch (comprehensiveError) {
        console.warn("Failed to fetch comprehensive portfolio data:", comprehensiveError);
        return null;
      }

    } catch (err) {
      await _handleOpError("fetching comprehensive portfolio data", err, studentId.value);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadLeaderboardUsers(): Promise<EnrichedStudentData[]> {
    isLoading.value = true;
    error.value = null;
    fetchError.value = null;

    try {
      const enrichedUsers = await fetchLeaderboardDataService();

      if (enrichedUsers.length === 0) {
        fetchError.value = "Leaderboard data is currently empty or could not be processed by the service.";
      }

      enrichedUsers.forEach(user => {
        _updateNameCache(user.uid, user.name ?? null);
      });

      return enrichedUsers;
    } catch (err) {
      await _handleFetchError("loading leaderboard users", err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }


  async function fetchUserNamesBatch(uidsToFetchParam: string[]): Promise<Record<string, string>> {
    if (isEmpty(uidsToFetchParam)) return {};
    const uniqueUids = [...new Set(uidsToFetchParam.filter(Boolean))];
    const namesMap: { [uid: string]: string } = {};
    const idsToFetchFromDB: string[] = [];
    const nowTime = Date.now();

    uniqueUids.forEach(id => {
        const cached = nameCache.value.get(id);
        if (cached && (nowTime - cached.timestamp < NAME_CACHE_TTL)) {
            namesMap[id] = cached.name;
        } else {
            idsToFetchFromDB.push(id);
        }
    });

    if (idsToFetchFromDB.length > 0) {
        try {
            const serviceFetchedNames = await fetchUserNamesBatchService(idsToFetchFromDB);
            
            for (const id in serviceFetchedNames) {
                if (Object.prototype.hasOwnProperty.call(serviceFetchedNames, id)) {
                    const nameVal = serviceFetchedNames[id];
                    if (nameVal) {
                        namesMap[id] = nameVal;
                        _updateNameCache(id, nameVal); 
                    }
                }
            }
            
             idsToFetchFromDB.forEach(id => {
                if (!namesMap[id]) {
                }
            });
        } catch (err) {
            await _handleOpError("fetching user names batch", err); 
             idsToFetchFromDB.forEach(id => { if (!namesMap[id]) namesMap[id] = `Error (${id.substring(0,5)})`; });
        }
    }
    return namesMap;
  }

  function clearStaleNameCache() {
    const nowTime = Date.now();
    const newCache = new Map<string, NameCacheEntry>();
    let clearedCount = 0;
    nameCache.value.forEach((entry, uid) => {
        if (nowTime - entry.timestamp < NAME_CACHE_TTL) {
            newCache.set(uid, entry);
        } else {
            clearedCount++;
        }
    });
    if (clearedCount > 0) {
        nameCache.value = newCache;
    }
  }

  async function fetchAllStudentProfiles(): Promise<UserData[]> { 
    if (allUsers.value.length > 0) {
      return allUsers.value;
    }
    isLoading.value = true;
    fetchError.value = null;
    try {
      const fetchedUsers = await fetchAllStudentProfilesService();
      
      allUsers.value = fetchedUsers;
      fetchedUsers.forEach(user => {
        _updateNameCache(user.uid, user.name ?? null); 
      });
      return fetchedUsers;
    } catch (err) {
      await _handleFetchError("fetching all student profiles", err);
      return []; 
    } finally {
      isLoading.value = false;
    }
  }

  const unsubscribeProfileAuthListener = () => {
  };

  // --- Image Upload Functions (Removed as Cloudinary is being replaced) ---
  // async function uploadProfileImage(...) { ... }
  // async function updateProfileImage(...) { ... }
  // function getOptimizedProfileImageUrl(...) { ... }
  // function resetImageUploadState() { ... }

  function clearError(): void {
    error.value = null;
    actionError.value = null;
    fetchError.value = null;
  }


  return {
    currentStudent,
    isLoading,
    isLoadingUserRequests,
    error,
    actionError,
    fetchError,
    hasFetched,
    nameCache,
    viewedStudentProfile,
    viewedStudentProjects,
    viewedStudentEventHistory,
    currentUserPortfolioData,
    studentId,
    studentName,
    studentBatchYear,
    studentXP,
    currentStudentPhotoURL,
    isAuthenticated,
    getCachedStudentName,
    handleAuthStateChange,
    fetchMyProfile,
    studentSignOut,
    clearStudentSession,
    updateMyProfile,
    fetchProfileForView,
    fetchCurrentUserPortfolioData,
    fetchCurrentUserComprehensivePortfolioData,
    loadLeaderboardUsers,
    fetchUserNamesBatch,
    clearStaleNameCache,
    getAllUsers,
    allUsers,
    fetchAllStudentProfiles,
    unsubscribeProfileAuthListener,
    // Expose user requests related state and actions
    userRequests,
    fetchUserRequests,
    removeUserRequestById,
    clearError
  };
});