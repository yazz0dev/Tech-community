// Database configuration
// Configure which data source to use: 'static' for JSON files or 'firebase' for Firestore

export type DataSource = 'static' | 'firebase';

export interface DatabaseConfig {
  dataSource: DataSource;
  staticDataPath?: string;
  firebase?: {
    enabled: boolean;
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export const databaseConfig: DatabaseConfig = {
  // Use 'static' for JSON-based data (no database required)
  // Use 'firebase' to connect to Firebase Firestore
  dataSource: (import.meta.env.VITE_DATA_SOURCE || 'static') as DataSource,
  
  staticDataPath: '/data',
  
  firebase: {
    enabled: import.meta.env.VITE_FIREBASE_API_KEY ? true : false,
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
};

export default databaseConfig;
