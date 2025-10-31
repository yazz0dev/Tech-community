# Database Setup Guide

## Overview

The Tech Community Platform supports multiple data sources. You can run it with:
1. **Static JSON files** (default, no database required)
2. **Firebase Firestore** (cloud database)
3. **Custom database** (extend the adapter pattern)

## Static JSON Data (Default)

### When to Use
- Getting started quickly
- Development and testing
- Small communities (<100 users)
- No backend infrastructure
- Demos and prototypes

### Setup

1. **Configure data source in `.env`:**
```env
VITE_DATA_SOURCE=static
```

2. **Edit JSON files in `public/data/`:**
   - `events.json` - Event data
   - `students.json` - User data

3. **That's it!** No additional setup required.

### Limitations
- Data changes are stored in `localStorage` only
- No real-time synchronization
- No authentication system
- No file uploads
- Limited to browser storage capacity

### Data Persistence

Changes made in the app are saved to `localStorage`:
```
Key: techcomm_events
Key: techcomm_students
```

To export data:
```javascript
// In browser console
const events = localStorage.getItem('techcomm_events');
console.log(JSON.parse(events));
```

## Firebase Firestore

### When to Use
- Production deployments
- Need authentication
- Real-time updates required
- File uploads needed
- Multiple devices/users
- Scaling beyond 100 users

### Setup

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable Google Analytics (optional)

#### 2. Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose production mode
4. Select a location

#### 3. Enable Authentication (Optional)

1. Go to "Authentication" in Firebase Console
2. Click "Get started"
3. Enable "Email/Password" provider
4. Configure sign-in methods as needed

#### 4. Enable Storage (Optional)

For file uploads:
1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Accept default security rules
4. Choose a location

#### 5. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" app icon (</>)
4. Register your app
5. Copy the configuration values

#### 6. Configure Environment Variables

Update `.env`:
```env
# Use Firebase as data source
VITE_DATA_SOURCE=firebase

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

#### 7. Set Up Firestore Security Rules

In Firebase Console, go to Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/students/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Events collection
    match /events/{eventId} {
      // Anyone can read approved/closed events
      allow read: if resource.data.status in ['Approved', 'Closed'];
      
      // Users can read their own pending events
      allow read: if isAuthenticated() && 
                     resource.data.requestedBy == request.auth.uid;
      
      // Authenticated users can create events
      allow create: if isAuthenticated();
      
      // Admins can update/delete any event
      allow update, delete: if isAdmin();
      
      // Users can update their own pending events
      allow update: if isAuthenticated() && 
                       resource.data.requestedBy == request.auth.uid &&
                       resource.data.status == 'Pending';
    }
    
    // Students collection
    match /students/{studentId} {
      // Users can read any student profile
      allow read: if true;
      
      // Users can update their own profile
      allow update: if isAuthenticated() && 
                       request.auth.uid == studentId;
      
      // Admins can create/update/delete any profile
      allow create, update, delete: if isAdmin();
    }
    
    // XP collection
    match /xp/{xpId} {
      // Anyone can read XP records
      allow read: if true;
      
      // Only admins can write XP records
      allow create, update, delete: if isAdmin();
    }
    
    // Signup collection (for student registration)
    match /signup/{document=**} {
      // Anyone can create signup requests
      allow create: if true;
      
      // Admins can read/update signup requests
      allow read, update: if isAdmin();
    }
  }
}
```

#### 8. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

#### 9. Set Up Firestore Indexes

For efficient queries, create indexes in Firestore Console or `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "details.date.start", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "requestedBy", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "batch", "order": "ASCENDING" },
        { "fieldPath": "displayName", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Migrating from Static to Firebase

1. **Export static data:**
```javascript
// In browser console with static mode
const events = JSON.parse(localStorage.getItem('techcomm_events') || '[]');
const students = JSON.parse(localStorage.getItem('techcomm_students') || '[]');
console.log('Events:', events);
console.log('Students:', students);
```

2. **Import to Firestore:**

Create a migration script `scripts/migrate.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  const events = require('../public/data/events.json');
  const students = require('../public/data/students.json');
  
  // Import events
  for (const event of events) {
    await db.collection('events').doc(event.id).set(event);
    console.log(`Imported event: ${event.details.eventName}`);
  }
  
  // Import students
  for (const student of students) {
    await db.collection('students').doc(student.uid).set(student);
    console.log(`Imported student: ${student.displayName}`);
  }
  
  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

3. **Run migration:**
```bash
node scripts/migrate.js
```

4. **Update `.env`:**
```env
VITE_DATA_SOURCE=firebase
```

## Custom Database Integration

You can integrate any database by implementing the `IDataAdapter` interface.

### 1. Create Your Adapter

Create `src/services/dataAdapter/CustomDataAdapter.ts`:

```typescript
import type { IDataAdapter } from './IDataAdapter';
import type { Event } from '@/types/event';
import type { Student } from '@/types/student';

export class CustomDataAdapter implements IDataAdapter {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  async getEvents(): Promise<Event[]> {
    const response = await fetch(`${this.apiBaseUrl}/events`);
    return response.json();
  }

  async getEvent(id: string): Promise<Event | null> {
    const response = await fetch(`${this.apiBaseUrl}/events/${id}`);
    if (!response.ok) return null;
    return response.json();
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const response = await fetch(`${this.apiBaseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return response.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    await fetch(`${this.apiBaseUrl}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/events/${id}`, {
      method: 'DELETE'
    });
  }

  // Implement other methods...
  async getStudents(): Promise<Student[]> { /* ... */ }
  async getStudent(id: string): Promise<Student | null> { /* ... */ }
  async createStudent(student: Omit<Student, 'uid'>): Promise<Student> { /* ... */ }
  async updateStudent(id: string, updates: Partial<Student>): Promise<void> { /* ... */ }
  async queryEvents(filters: Record<string, any>): Promise<Event[]> { /* ... */ }
  async queryStudents(filters: Record<string, any>): Promise<Student[]> { /* ... */ }
}
```

### 2. Register Your Adapter

Update `src/services/dataAdapter/IDataAdapter.ts`:

```typescript
export async function getDataAdapter(): Promise<IDataAdapter> {
  // ... existing code ...
  
  } else if (databaseConfig.dataSource === 'custom') {
    const { CustomDataAdapter } = await import('./CustomDataAdapter');
    adapterInstance = new CustomDataAdapter();
  }
  
  // ... rest of code ...
}
```

### 3. Configure

Update `src/config/database.config.ts`:

```typescript
export type DataSource = 'static' | 'firebase' | 'custom';
```

Update `.env`:
```env
VITE_DATA_SOURCE=custom
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Comparison

| Feature | Static JSON | Firebase | Custom DB |
|---------|------------|----------|-----------|
| Setup Time | < 1 min | 30 min | Varies |
| Cost | Free | Free tier, then pay | Varies |
| Authentication | No | Yes | Depends |
| Real-time Updates | No | Yes | Depends |
| Scalability | Limited | High | Depends |
| Offline Support | Yes | Partial | Depends |
| File Storage | No | Yes | Depends |
| Learning Curve | None | Medium | Varies |

## Best Practices

### Development
- Use static JSON for rapid prototyping
- Test with Firebase staging environment
- Use `.env.local` for local config

### Production
- Always use a real database (Firebase or custom)
- Enable authentication
- Set up proper security rules
- Monitor usage and costs
- Regular backups
- Use environment-specific configs

### Security
- Never commit `.env` files
- Use least-privilege security rules
- Validate all inputs
- Sanitize user data
- Enable audit logging
- Regular security reviews

## Troubleshooting

### Firebase Connection Issues
```bash
# Check Firebase config
echo $VITE_FIREBASE_PROJECT_ID

# Test Firebase connection
firebase projects:list
```

### Static Data Not Loading
- Check JSON file syntax
- Verify file path in browser DevTools
- Check browser console for errors

### Performance Issues
- Add Firestore indexes for queries
- Use pagination for large datasets
- Enable caching
- Monitor query performance

## Next Steps

- Learn about [Event Lifecycle](./event-lifecycle.md)
- Build an [Admin Panel](./building-admin-panel.md)
- Explore [Architecture](./architecture.md)
