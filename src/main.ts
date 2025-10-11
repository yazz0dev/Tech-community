// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "./router";
import AuthGuard from "@/components/AuthGuard.vue";
import { auth } from '@/data/auth';
import { initializeAuth } from '@/services/authService'; // Import the initialization function
import { MotionPlugin } from '@vueuse/motion';

// Import stores only once
import { useAppStore } from "@/stores/appStore";
import { useProfileStore } from "@/stores/profileStore";
import { useNotificationStore } from "./stores/notificationStore";

import "@fortawesome/fontawesome-free/css/all.css";
import "./styles/main.scss";

// PWA Registration
import { registerSW } from 'virtual:pwa-register'

// --- Initialize App ---
async function initializeApp() {
  try {
    // Initialize Firebase Auth persistence
    await initializeAuth();

    // Create pinia instance
    const pinia = createPinia();

    // Create the Vue application
    const app = createApp(App);
    app.use(pinia);
    app.use(router);
    app.use(MotionPlugin);
    app.component("AuthGuard", AuthGuard);

    // Initialize app stores *after* pinia is used
    const appStore = useAppStore();
    const profileStore = useProfileStore();

    // Initialize app listeners
    appStore.initAppListeners();

    // PWA Service Worker Registration
    const updateSW = registerSW({
      onNeedRefresh() {
        appStore.setNewAppVersionAvailable(true);
      },
      onOfflineReady() {
        const notificationStore = useNotificationStore();
        notificationStore.showNotification({
          message: 'App is ready to work offline!',
          type: 'success',
          duration: 3000
        });
      },
      onRegisterError(_error) {
        // Handle registration error if needed
      }
    });

    // Make updateSW available globally
    window.__updateSW = updateSW;

    // Set up a single, definitive auth state listener
    auth.onAuthStateChanged(async (user) => {
      try {
        // Delegate auth state handling directly to the profile store
        await profileStore.handleAuthStateChange(user);
      } catch (error) {
        console.error('Critical error during auth state change handling:', error);
        // Optionally, show a global error message to the user
      } finally {
        // Ensure the app knows the initial auth check is complete.
        if (!appStore.hasFetchedInitialAuth) {
          appStore.setHasFetchedInitialAuth(true);
        }
      }
    });

    // Mount the app. The UI will be guarded by AuthGuard or similar
    // components which react to the stores' state.
    app.mount('#app');

  } catch (error) {
    console.error('Error initializing auth persistence or app:', error);
    // Handle critical initialization error (e.g., render a static error page)
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>Application Error</h1>
          <p>Could not initialize the application. Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Start the application
initializeApp();

