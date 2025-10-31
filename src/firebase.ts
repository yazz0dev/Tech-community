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
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

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

// Export with non-null assertion for backward compatibility
// Services should check if Firebase is enabled before using these
export { db, auth, app };