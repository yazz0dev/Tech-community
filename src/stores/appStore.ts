import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useNotificationStore } from './notificationStore';

export const useAppStore = defineStore('studentApp', () => {
  const currentTheme = ref<'light' | 'dark'>('light');
  const isOnline = ref<boolean>(navigator.onLine);
  const hasFetchedInitialAuth = ref<boolean>(false);
  const newAppVersionAvailable = ref<boolean>(false);
  const isProcessingLogin = ref<boolean>(false);
  const redirectAfterLogin = ref<string | null>(null);
  const forceProfileRefetch = ref<boolean>(false);

  const notificationStore = useNotificationStore();

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
    
    if (status) {
      notificationStore.showNotification({ message: 'You are back online!', type: 'success' });
    } else {
      notificationStore.showNotification({ message: 'You are offline. Some features are limited.', type: 'warning' });
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
    setTheme, initTheme, setNetworkOnlineStatus, setHasFetchedInitialAuth, setNewAppVersionAvailable,
    setIsProcessingLogin, setRedirectAfterLogin, getRedirectAfterLogin, setForceProfileRefetch, clearForceProfileRefetch,
    initAppListeners
  };
});