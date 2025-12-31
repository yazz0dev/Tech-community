// src/stores/appStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isFirebaseEnabled, getFirestoreInstance } from '@/firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { useNotificationStore } from './notificationStore';
import { useEventStore } from './eventStore';
import type { QueuedAction } from '@/types/store';

export const useAppStore = defineStore('studentApp', () => {
  const currentTheme = ref<'light' | 'dark'>('light');
  const isOnline = ref<boolean>(navigator.onLine);
  const hasFetchedInitialAuth = ref<boolean>(false);
  const newAppVersionAvailable = ref<boolean>(false);
  const isProcessingLogin = ref<boolean>(false);
  const redirectAfterLogin = ref<string | null>(null);
  const forceProfileRefetch = ref<boolean>(false);

  const offlineQueue = ref<{
    actions: QueuedAction[];
    isSyncing: boolean;
    supportedActionTypes: string[];
  }>({
    actions: [],
    isSyncing: false,
    supportedActionTypes: [
      'studentEvents/submitEventSelections',
      'studentEvents/submitProject',
      'studentEvents/submitOrganizerRating',
      'studentEvents/joinEvent',
      'studentEvents/leaveEvent',
      'studentEvents/closeEventPermanently',
    ],
  });

  const notificationStore = useNotificationStore();

  const hasPendingOfflineActions = ref(offlineQueue.value.actions.length > 0);
  const pendingActionCount = ref(offlineQueue.value.actions.length);

  function setTheme(theme: 'light' | 'dark') {
    currentTheme.value = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('student-app-theme', theme);
  }

  function initTheme() {
    const storedTheme = localStorage.getItem('student-app-theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('student-app-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  async function setNetworkOnlineStatus(status: boolean) {
    if (isOnline.value === status) return;
    isOnline.value = status;
    
    try {
      if (!isFirebaseEnabled()) {
        // Firebase not enabled, just show notification
        if (status) {
          notificationStore.showNotification({ message: 'You are back online!', type: 'success' });
        } else {
          notificationStore.showNotification({ message: 'You are offline. Some features are limited.', type: 'warning' });
        }
        return;
      }
      
      if (status) {
        await enableNetwork(getFirestoreInstance());
        notificationStore.showNotification({ message: 'You are back online!', type: 'success' });
        await syncOfflineActions();
      } else {
        await disableNetwork(getFirestoreInstance());
        notificationStore.showNotification({ message: 'You are offline. Some features are limited.', type: 'warning' });
      }
    } catch (e) {
      console.error(`Failed to ${status ? 'enable' : 'disable'} network:`, e);
    }
  }

  function setHasFetchedInitialAuth(status: boolean) {
    hasFetchedInitialAuth.value = status;
  }

  function setNewAppVersionAvailable(status: boolean) {
    newAppVersionAvailable.value = status;
  }

  function setIsProcessingLogin(value: boolean) {
    isProcessingLogin.value = value;
  }

  function setRedirectAfterLogin(path: string | null) {
    if (path && path.startsWith('/') && !path.startsWith('//') && path !== '/login') {
      redirectAfterLogin.value = path;
      sessionStorage.setItem('redirectAfterLogin', path);
    } else if (path === null) {
      redirectAfterLogin.value = null;
      sessionStorage.removeItem('redirectAfterLogin');
    }
  }

  function getRedirectAfterLogin(): string {
    const storedRedirect = redirectAfterLogin.value || sessionStorage.getItem('redirectAfterLogin');
    setRedirectAfterLogin(null);
    return (storedRedirect && storedRedirect !== '/login') ? storedRedirect : '/home';
  }

  function setForceProfileRefetch(value: boolean) {
    forceProfileRefetch.value = value;
  }

  function clearForceProfileRefetch() {
    forceProfileRefetch.value = false;
  }

  async function tryQueueAction(action: { type: string; payload: unknown }): Promise<void> {
    if (isOnline.value) {
      // If online, execute immediately
      const eventStore = useEventStore();
      const [storeName, actionName] = action.type.split('/');
      
      if (storeName === 'studentEvents') {
        const storeAction = (eventStore as any)[actionName as keyof typeof eventStore];
        if (typeof storeAction === 'function') {
          await storeAction(action.payload);
        } else {
          throw new Error(`Action type ${action.type} is not a valid function in the event store.`);
        }
      } else {
        throw new Error(`Store name ${storeName} is not supported for queued actions.`);
      }
      return;
    }

    if (offlineQueue.value.supportedActionTypes.includes(action.type)) {
      const newQueuedAction: QueuedAction = {
        id: `queued_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: action.type,
        payload: action.payload,
        timestamp: Date.now(),
      };
      offlineQueue.value.actions.push(newQueuedAction);
      notificationStore.showNotification({ message: `Action queued. Will sync when online.`, type: 'info' });
    } else {
      throw new Error(`Action '${action.type}' cannot be performed offline.`);
    }
  }

  async function syncOfflineActions() {
    if (offlineQueue.value.isSyncing || !hasPendingOfflineActions.value) return;

    offlineQueue.value.isSyncing = true;
    notificationStore.showNotification({ message: `Syncing ${pendingActionCount.value} offline action(s)...`, type: 'info' });

    const eventStore = useEventStore();
    const actionsToProcess = [...offlineQueue.value.actions];
    offlineQueue.value.actions = []; // Clear queue optimistically

    for (const action of actionsToProcess) {
      try {
        const [storeName, actionName] = action.type.split('/');
        
        if (storeName === 'studentEvents') {
        const storeAction = (eventStore as any)[actionName as keyof typeof eventStore];
          if (typeof storeAction === 'function') {
            await storeAction(action.payload);
          } else {
            throw new Error(`Action ${action.type} not found.`);
          }
        } else {
          throw new Error(`Store name ${storeName} not supported for sync.`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown sync error";
        action.error = errorMessage;
        offlineQueue.value.actions.push(action); // Re-queue failed action
        notificationStore.showNotification({ message: `Failed to sync action: ${action.type}. It has been re-queued.`, type: 'error' });
      }
    }

    offlineQueue.value.isSyncing = false;
    if (offlineQueue.value.actions.length === 0 && actionsToProcess.length > 0) {
      notificationStore.showNotification({ message: 'All pending actions synced successfully.', type: 'success' });
    }
  }

  function initAppListeners() {
    window.addEventListener('online', () => setNetworkOnlineStatus(true));
    window.addEventListener('offline', () => setNetworkOnlineStatus(false));
    initTheme();
    const storedPath = sessionStorage.getItem('redirectAfterLogin');
    if (storedPath) {
      redirectAfterLogin.value = storedPath;
    }
  }

  return {
    currentTheme, isOnline, hasFetchedInitialAuth, newAppVersionAvailable, isProcessingLogin, redirectAfterLogin, forceProfileRefetch,
    offlineQueue, hasPendingOfflineActions, pendingActionCount,
    setTheme, initTheme, setNetworkOnlineStatus, setHasFetchedInitialAuth, setNewAppVersionAvailable,
    setIsProcessingLogin, setRedirectAfterLogin, getRedirectAfterLogin, setForceProfileRefetch, clearForceProfileRefetch,
    tryQueueAction, syncOfflineActions, initAppListeners
  };
});