// src/stores/profileStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useNotificationStore } from './notificationStore';
import { useAppStore } from './appStore';
import type { EnrichedUser, User } from '@/models/user';
import { 
    fetchStudentData as fetchStudentDataService,
    updateStudentProfile as updateStudentProfileService,
    fetchUserNamesBatch as fetchUserNamesBatchService,
    fetchAllStudentProfiles as fetchAllStudentProfilesService,
    fetchLeaderboardData as fetchLeaderboardDataService,
} from '@/services/profileService';

export const useProfileStore = defineStore('profile', () => {
  const notificationStore = useNotificationStore();
  const appStore = useAppStore();

  const currentStudent = ref<EnrichedUser | null>(null);
  const allUsers = ref<User[]>([]);
  const nameCache = ref<Map<string, { name: string; timestamp: number }>>(new Map());
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // --- Getters ---
  const studentId = computed(() => currentStudent.value?.uid || null);
  const isAuthenticated = computed(() => !!currentStudent.value?.uid);
  const studentName = computed(() => currentStudent.value?.name || 'User');


  async function handleAuthStateChange(user: { uid: string } | null) {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;
    
    if (user) {
      try {
        const enrichedData = await fetchStudentDataService(user.uid);
        
        if (enrichedData) {
          currentStudent.value = enrichedData;
        } else {
          currentStudent.value = null;
          notificationStore.showNotification({ 
            message: "Authentication successful, but no student profile was found. Please contact an admin to have your account set up.",
            type: 'warning',
            duration: 10000
          });
          error.value = "Student profile not found for authenticated user.";
        }
      } catch (err) {
        error.value = "Failed to fetch user data.";
        currentStudent.value = null;
        notificationStore.showNotification({ 
          message: "We couldn't load your profile due to an error.",
          type: 'error',
          duration: 10000
        });
      }
    } else {
      currentStudent.value = null;
    }
    
    isLoading.value = false;
    appStore.setHasFetchedInitialAuth(true);
  }

  async function fetchAllStudentProfiles(): Promise<User[]> {
    if (allUsers.value.length > 0) {
      return allUsers.value;
    }
    isLoading.value = true;
    try {
      const fetchedUsers = await fetchAllStudentProfilesService();
      allUsers.value = fetchedUsers;
      return fetchedUsers;
    } catch (err) {
      error.value = "Failed to fetch all user profiles.";
      return []; 
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUserNamesBatch(uids: string[]): Promise<Record<string, string>> {
    const namesMap: Record<string, string> = {};
    const idsToFetch: string[] = [];

    uids.forEach(id => {
      const cached = nameCache.value.get(id);
      if (cached && (Date.now() - cached.timestamp < 3600000)) { // 1 hour cache
        namesMap[id] = cached.name;
      } else {
        idsToFetch.push(id);
      }
    });

    if (idsToFetch.length > 0) {
      try {
        const fetchedNames = await fetchUserNamesBatchService(idsToFetch);
        Object.assign(namesMap, fetchedNames);
        for (const id in fetchedNames) {
          nameCache.value.set(id, { name: fetchedNames[id], timestamp: Date.now() });
        }
      } catch (err) {
        error.value = "Failed to fetch user names.";
      }
    }
    return namesMap;
  }

  return {
    currentStudent,
    isLoading,
    error,
    studentId,
    isAuthenticated,
    studentName,
    handleAuthStateChange,
    fetchAllStudentProfiles,
    fetchUserNamesBatch,
    allUsers
  };
});