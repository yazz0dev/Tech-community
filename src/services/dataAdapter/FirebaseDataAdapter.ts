// Firebase data adapter
// Connects to Firebase Firestore for data storage

import type { IDataAdapter } from './IDataAdapter';
import type { Event } from '@/types/event';
import type { StudentAppModel as Student } from '@/types/student';
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
  Firestore,
  type PartialWithFieldValue
} from 'firebase/firestore';
import { getFirestoreInstance } from '@/firebase';

export class FirebaseDataAdapter implements IDataAdapter {
  private db: Firestore;

  constructor() {
    // Use the type-safe helper to get the Firestore instance
    this.db = getFirestoreInstance();
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
    // Cast to PartialWithFieldValue for Firestore compatibility
    await updateDoc(docRef, updates as PartialWithFieldValue<Event>);
  }

  async deleteEvent(id: string): Promise<void> {
    const docRef = doc(this.db, 'events', id);
    await deleteDoc(docRef);
  }

  async getStudents(): Promise<Student[]> {
    const snapshot = await getDocs(collection(this.db, 'students'));
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return { 
        ...data,
        uid: docSnap.id, 
        email: data['email'] ?? null,
        name: data['name'] ?? null,
      } as Student;
    });
  }

  async getStudent(id: string): Promise<Student | null> {
    const docRef = doc(this.db, 'students', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return { 
      ...data,
      uid: docSnap.id, 
      email: data['email'] ?? null,
      name: data['name'] ?? null,
    } as Student;
  }

  async createStudent(student: Omit<Student, 'uid'>): Promise<Student> {
    const docRef = await addDoc(collection(this.db, 'students'), student);
    return { 
      ...student,
      uid: docRef.id, 
      email: (student as { email?: string | null }).email ?? null,
      name: (student as { name?: string | null }).name ?? null,
    } as Student;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const docRef = doc(this.db, 'students', id);
    // Cast to PartialWithFieldValue for Firestore compatibility
    await updateDoc(docRef, updates as PartialWithFieldValue<Student>);
  }

  async queryEvents(filters: Record<string, unknown>): Promise<Event[]> {
    const q = collection(this.db, 'events');
    const constraints = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        return where(key, 'in', value);
      }
      return where(key, '==', value);
    });
    
    const queryRef = query(q, ...constraints);
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  }

  async queryStudents(filters: Record<string, unknown>): Promise<Student[]> {
    const q = collection(this.db, 'students');
    const constraints = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        return where(key, 'in', value);
      }
      return where(key, '==', value);
    });
    
    const queryRef = query(q, ...constraints);
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        uid: doc.id, 
        email: data['email'] || null,
        name: data['name'] || null,
        ...data 
      } as Student;
    });
  }
}
