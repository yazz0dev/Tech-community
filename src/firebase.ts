import { type FirebaseApp, initializeApp } from "firebase/app";
// Import getFirestore and specific cache options
import { 
    Firestore, 
    getFirestore
} from "firebase/firestore"; 
import { type Auth, getAuth } from 'firebase/auth';
import { databaseConfig } from '@/config/database.config';

// Firebase config and initialization
// Only initialize if Firebase is enabled
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (databaseConfig.firebase?.enabled && databaseConfig.dataSource === 'firebase') {
    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY!, 
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
        appId: import.meta.env.VITE_FIREBASE_APP_ID!
    };

    // Initialize Firebase app
    app = initializeApp(firebaseConfig);

    // Initialize Firestore
    db = getFirestore(app);

    // Initialize Auth
    auth = getAuth(app);
}

// Helper to check if Firebase is initialized
export function isFirebaseEnabled(): boolean {
    return !!auth && !!db;
}

/**
 * Get Firestore instance with type guard.
 * Throws error if Firebase is not enabled.
 */
export function getFirestoreInstance(): Firestore {
    if (!db) {
        throw new Error('Firebase Firestore is not initialized. Set VITE_DATA_SOURCE=firebase and configure Firebase.');
    }
    return db;
}

/**
 * Get Auth instance with type guard.
 * Throws error if Firebase is not enabled.
 */
export function getAuthInstance(): Auth {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Set VITE_DATA_SOURCE=firebase and configure Firebase.');
    }
    return auth;
}

// Export with undefined types - consumers must check isFirebaseEnabled()
export { db, auth, app };