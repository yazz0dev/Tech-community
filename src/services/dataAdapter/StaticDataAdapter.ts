// Static JSON data adapter
// Loads data from JSON files in the public/data directory

import type { IDataAdapter } from './IDataAdapter';
import type { Event } from '@/types/event';
import type { Student } from '@/types/student';
import { databaseConfig } from '@/config/database.config';

export class StaticDataAdapter implements IDataAdapter {
  private eventsCache: Event[] | null = null;
  private studentsCache: Student[] | null = null;
  private readonly basePath: string;

  constructor() {
    this.basePath = databaseConfig.staticDataPath || '/data';
  }

  private async loadJSON<T>(filename: string): Promise<T> {
    const response = await fetch(`${this.basePath}/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return response.json();
  }

  async getEvents(): Promise<Event[]> {
    if (!this.eventsCache) {
      this.eventsCache = await this.loadJSON<Event[]>('events.json');
    }
    return [...this.eventsCache];
  }

  async getEvent(id: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    // In static mode, we can't persist changes
    // You could use localStorage for temporary persistence
    const newEvent = { ...event, id: this.generateId() } as Event;
    const events = await this.getEvents();
    events.push(newEvent);
    this.eventsCache = events;
    
    // Optionally save to localStorage
    this.saveToLocalStorage('events', events);
    
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const events = await this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Event not found: ${id}`);
    }
    events[index] = { ...events[index], ...updates };
    this.eventsCache = events;
    
    // Optionally save to localStorage
    this.saveToLocalStorage('events', events);
  }

  async deleteEvent(id: string): Promise<void> {
    const events = await this.getEvents();
    this.eventsCache = events.filter(e => e.id !== id);
    
    // Optionally save to localStorage
    this.saveToLocalStorage('events', this.eventsCache);
  }

  async getStudents(): Promise<Student[]> {
    if (!this.studentsCache) {
      this.studentsCache = await this.loadJSON<Student[]>('students.json');
    }
    return [...this.studentsCache];
  }

  async getStudent(id: string): Promise<Student | null> {
    const students = await this.getStudents();
    return students.find(s => s.uid === id) || null;
  }

  async createStudent(student: Omit<Student, 'uid'>): Promise<Student> {
    const newStudent = { ...student, uid: this.generateId() } as Student;
    const students = await this.getStudents();
    students.push(newStudent);
    this.studentsCache = students;
    
    // Optionally save to localStorage
    this.saveToLocalStorage('students', students);
    
    return newStudent;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const students = await this.getStudents();
    const index = students.findIndex(s => s.uid === id);
    if (index === -1) {
      throw new Error(`Student not found: ${id}`);
    }
    students[index] = { ...students[index], ...updates };
    this.studentsCache = students;
    
    // Optionally save to localStorage
    this.saveToLocalStorage('students', students);
  }

  async queryEvents(filters: Record<string, any>): Promise<Event[]> {
    const events = await this.getEvents();
    return events.filter(event => {
      return Object.entries(filters).every(([key, value]) => {
        const eventValue = (event as any)[key];
        if (Array.isArray(value)) {
          return value.includes(eventValue);
        }
        return eventValue === value;
      });
    });
  }

  async queryStudents(filters: Record<string, any>): Promise<Student[]> {
    const students = await this.getStudents();
    return students.filter(student => {
      return Object.entries(filters).every(([key, value]) => {
        const studentValue = (student as any)[key];
        if (Array.isArray(value)) {
          return value.includes(studentValue);
        }
        return studentValue === value;
      });
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`techcomm_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }
}
