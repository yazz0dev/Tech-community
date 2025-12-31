// Database configuration
// Configure which data source to use for the application
// Supported data sources: 'static', 'firebase', 'supabase', 'mongodb', 'postgresql', 'mysql', 'rest'

/**
 * Supported data source types
 * - 'static': JSON files stored locally (no backend required)
 * - 'firebase': Firebase Firestore (cloud NoSQL database)
 * - 'supabase': Supabase PostgreSQL (open-source Firebase alternative)
 * - 'mongodb': MongoDB (NoSQL document database)
 * - 'postgresql': PostgreSQL (relational database)
 * - 'mysql': MySQL (relational database)
 * - 'rest': Custom REST API backend
 */
export type DataSource = 'static' | 'firebase' | 'supabase' | 'mongodb' | 'postgresql' | 'mysql' | 'rest';

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
  supabase?: {
    enabled: boolean;
    url?: string;
    anonKey?: string;
  };
  mongodb?: {
    enabled: boolean;
    uri?: string;
    database?: string;
  };
  postgresql?: {
    enabled: boolean;
    connectionString?: string;
  };
  mysql?: {
    enabled: boolean;
    connectionString?: string;
  };
  rest?: {
    enabled: boolean;
    baseUrl?: string;
    authHeader?: string;
  };
}

export const databaseConfig: DatabaseConfig = {
  // Use 'static' for JSON-based data (no database required)
  // Use 'firebase' to connect to Firebase Firestore
  // Use 'supabase' to connect to Supabase
  // Use 'mongodb' to connect to MongoDB
  // Use 'postgresql' to connect to PostgreSQL
  // Use 'mysql' to connect to MySQL
  // Use 'rest' to connect to a custom REST API
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
  
  supabase: {
    enabled: import.meta.env.VITE_SUPABASE_URL ? true : false,
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  mongodb: {
    enabled: import.meta.env.VITE_MONGODB_URI ? true : false,
    uri: import.meta.env.VITE_MONGODB_URI,
    database: import.meta.env.VITE_MONGODB_DATABASE,
  },
  
  postgresql: {
    enabled: import.meta.env.VITE_POSTGRESQL_CONNECTION_STRING ? true : false,
    connectionString: import.meta.env.VITE_POSTGRESQL_CONNECTION_STRING,
  },
  
  mysql: {
    enabled: import.meta.env.VITE_MYSQL_CONNECTION_STRING ? true : false,
    connectionString: import.meta.env.VITE_MYSQL_CONNECTION_STRING,
  },
  
  rest: {
    enabled: import.meta.env.VITE_REST_API_URL ? true : false,
    baseUrl: import.meta.env.VITE_REST_API_URL,
    authHeader: import.meta.env.VITE_REST_API_AUTH_HEADER,
  },
};

export default databaseConfig;
