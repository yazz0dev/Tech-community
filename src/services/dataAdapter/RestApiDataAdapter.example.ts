/**
 * REST API Data Adapter Template
 * 
 * This is an example implementation of a custom data adapter that connects
 * to a REST API backend. Use this as a starting point for integrating
 * your own backend.
 * 
 * To use this adapter:
 * 1. Rename this file to RestApiDataAdapter.ts
 * 2. Implement all methods according to your API
 * 3. Update IDataAdapter.ts to import and use this adapter
 * 4. Set VITE_DATA_SOURCE=rest in your .env file
 * 5. Configure VITE_REST_API_URL with your API base URL
 * 
 * @example
 * ```env
 * VITE_DATA_SOURCE=rest
 * VITE_REST_API_URL=https://api.yourbackend.com/v1
 * VITE_REST_API_AUTH_HEADER=Bearer your-token
 * ```
 */

import type { IDataAdapter } from './IDataAdapter';
import type { Event } from '@/types/event';
import type { StudentAppModel as Student } from '@/types/student';
import { databaseConfig } from '@/config/database.config';

export class RestApiDataAdapter implements IDataAdapter {
  private baseUrl: string;
  private authHeader: string | null;

  constructor() {
    if (!databaseConfig.rest?.baseUrl) {
      throw new Error('REST API URL is not configured. Set VITE_REST_API_URL in your .env file.');
    }
    this.baseUrl = databaseConfig.rest.baseUrl;
    this.authHeader = databaseConfig.rest.authHeader || null;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.authHeader) {
      (headers as Record<string, string>)['Authorization'] = this.authHeader;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // ==================== Event Operations ====================

  async getEvents(): Promise<Event[]> {
    const response = await this.fetchWithAuth('/events');
    return response.json();
  }

  async getEvent(id: string): Promise<Event | null> {
    try {
      const response = await this.fetchWithAuth(`/events/${id}`);
      return response.json();
    } catch (error) {
      // Return null if not found
      return null;
    }
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const response = await this.fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return response.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    await this.fetchWithAuth(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await this.fetchWithAuth(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Student Operations ====================

  async getStudents(): Promise<Student[]> {
    const response = await this.fetchWithAuth('/students');
    return response.json();
  }

  async getStudent(id: string): Promise<Student | null> {
    try {
      const response = await this.fetchWithAuth(`/students/${id}`);
      return response.json();
    } catch (error) {
      return null;
    }
  }

  async createStudent(student: Omit<Student, 'uid'>): Promise<Student> {
    const response = await this.fetchWithAuth('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    return response.json();
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    await this.fetchWithAuth(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ==================== Query Operations ====================

  async queryEvents(filters: Record<string, unknown>): Promise<Event[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.append(key, value.join(','));
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await this.fetchWithAuth(`/events?${params.toString()}`);
    return response.json();
  }

  async queryStudents(filters: Record<string, unknown>): Promise<Student[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.append(key, value.join(','));
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await this.fetchWithAuth(`/students?${params.toString()}`);
    return response.json();
  }
}
