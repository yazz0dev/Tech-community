// Firebase data adapter
// Connects to Firebase Firestore for data storage

import type { IDataAdapter } from './IDataAdapter';
import type { Event } from '@/types/event';
import type { Student } from '@/types/student';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Firestore
} from 'firebase/firestore';

export class FirebaseDataAdapter implements IDataAdapter {
  private db: Firestore;

  constructor() {
    // Lazy load Firebase to avoid initialization errors in static mode
    const { db } = require('@/firebase');
    this.db = db;
  }

  async getEvents(): Promise<Event[]> {
    const snapshot = await getDocs(collection(this.db, 'events'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  }

  async getEvent(id: string): Promise<Event | null> {
    const docRef = doc(this.db, 'events', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Event;
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const docRef = await addDoc(collection(this.db, 'events'), event);
    return { id: docRef.id, ...event } as Event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    const docRef = doc(this.db, 'events', id);
    await updateDoc(docRef, updates as any);
  }

  async deleteEvent(id: string): Promise<void> {
    const docRef = doc(this.db, 'events', id);
    await deleteDoc(docRef);
  }

  async getStudents(): Promise<Student[]> {
    const snapshot = await getDocs(collection(this.db, 'students'));
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Student));
  }

  async getStudent(id: string): Promise<Student | null> {
    const docRef = doc(this.db, 'students', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { uid: docSnap.id, ...docSnap.data() } as Student;
  }

  async createStudent(student: Omit<Student, 'uid'>): Promise<Student> {
    const docRef = await addDoc(collection(this.db, 'students'), student);
    return { uid: docRef.id, ...student } as Student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const docRef = doc(this.db, 'students', id);
    await updateDoc(docRef, updates as any);
  }

  async queryEvents(filters: Record<string, any>): Promise<Event[]> {
    let q = collection(this.db, 'events');
    const constraints = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        return where(key, 'in', value);
      }
      return where(key, '==', value);
    });
    
    const queryRef = query(q as any, ...constraints);
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  }

  async queryStudents(filters: Record<string, any>): Promise<Student[]> {
    let q = collection(this.db, 'students');
    const constraints = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        return where(key, 'in', value);
      }
      return where(key, '==', value);
    });
    
    const queryRef = query(q as any, ...constraints);
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Student));
  }
}
