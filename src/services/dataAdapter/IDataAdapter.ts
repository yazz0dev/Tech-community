// Data adapter interface for abstracting data access
// This allows switching between static JSON data and Firebase/other databases

import type { Event } from '@/types/event';
import type { StudentAppModel as Student } from '@/types/student';

/**
 * Data adapter interface that defines the contract for all data source implementations.
 * Implement this interface to add support for a new database or data source.
 * 
 * @example
 * ```typescript
 * export class MongoDBDataAdapter implements IDataAdapter {
 *   // Implement all methods...
 * }
 * ```
 */
export interface IDataAdapter {
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  createEvent(event: Omit<Event, 'id'>): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | null>;
  createStudent(student: Omit<Student, 'uid'>): Promise<Student>;
  updateStudent(id: string, student: Partial<Student>): Promise<void>;
  
  // Query operations
  queryEvents(filters: Record<string, unknown>): Promise<Event[]>;
  queryStudents(filters: Record<string, unknown>): Promise<Student[]>;
}

// Factory function to get the appropriate data adapter based on config
import { databaseConfig } from '@/config/database.config';

let adapterInstance: IDataAdapter | null = null;

/**
 * Get the appropriate data adapter based on the current configuration.
 * This factory function lazily initializes and caches the adapter instance.
 * 
 * Supported data sources:
 * - 'static': StaticDataAdapter (JSON files)
 * - 'firebase': FirebaseDataAdapter (Firestore)
 * - 'supabase': SupabaseDataAdapter (PostgreSQL via Supabase)
 * - 'rest': RestApiDataAdapter (Custom REST API)
 * 
 * To add a new database adapter:
 * 1. Create a new adapter file (e.g., MongoDBDataAdapter.ts)
 * 2. Implement the IDataAdapter interface
 * 3. Add a new case in this factory function
 * 4. Update the DataSource type in database.config.ts
 * 
 * @returns Promise<IDataAdapter> - The configured data adapter instance
 * @throws Error if the data source is not recognized
 */
export async function getDataAdapter(): Promise<IDataAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  switch (databaseConfig.dataSource) {
    case 'static': {
      const { StaticDataAdapter } = await import('./StaticDataAdapter');
      adapterInstance = new StaticDataAdapter();
      break;
    }
    case 'firebase': {
      const { FirebaseDataAdapter } = await import('./FirebaseDataAdapter');
      adapterInstance = new FirebaseDataAdapter();
      break;
    }
    // To add support for Supabase, uncomment and create the adapter:
    // case 'supabase': {
    //   const { SupabaseDataAdapter } = await import('./SupabaseDataAdapter');
    //   adapterInstance = new SupabaseDataAdapter();
    //   break;
    // }
    // To add support for MongoDB, uncomment and create the adapter:
    // case 'mongodb': {
    //   const { MongoDBDataAdapter } = await import('./MongoDBDataAdapter');
    //   adapterInstance = new MongoDBDataAdapter();
    //   break;
    // }
    // To add support for REST API, uncomment and create the adapter:
    // case 'rest': {
    //   const { RestApiDataAdapter } = await import('./RestApiDataAdapter');
    //   adapterInstance = new RestApiDataAdapter();
    //   break;
    // }
    default:
      throw new Error(
        `Unknown data source: ${databaseConfig.dataSource}. ` +
        `Supported sources: static, firebase. ` +
        `See docs/database-setup.md for how to add custom adapters.`
      );
  }

  return adapterInstance;
}

/**
 * Reset the adapter instance. Useful for testing or when changing configurations.
 */
export function resetDataAdapter(): void {
  adapterInstance = null;
}
