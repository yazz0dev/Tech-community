// Data adapter interface for abstracting data access
// This allows switching between static JSON data and Firebase/other databases

import type { Event } from '@/types/event';
import type { StudentAppModel as Student } from '@/types/student';

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
  queryEvents(filters: Record<string, any>): Promise<Event[]>;
  queryStudents(filters: Record<string, any>): Promise<Student[]>;
}

// Factory function to get the appropriate data adapter based on config
import { databaseConfig } from '@/config/database.config';

let adapterInstance: IDataAdapter | null = null;

export async function getDataAdapter(): Promise<IDataAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  if (databaseConfig.dataSource === 'static') {
    const { StaticDataAdapter } = await import('./StaticDataAdapter');
    adapterInstance = new StaticDataAdapter();
  } else if (databaseConfig.dataSource === 'firebase') {
    const { FirebaseDataAdapter } = await import('./FirebaseDataAdapter');
    adapterInstance = new FirebaseDataAdapter();
  } else {
    throw new Error(`Unknown data source: ${databaseConfig.dataSource}`);
  }

  return adapterInstance;
}
