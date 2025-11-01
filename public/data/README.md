# Static Data Files

This directory contains static JSON data files used when running the application without a database connection.

## Files

- `events.json` - Event data
- `students.json` - Student/user data

## Usage

When `VITE_DATA_SOURCE=static` is set in your `.env` file (or not set at all, as it's the default), the application will load data from these JSON files instead of connecting to a database.

## Customization

You can edit these JSON files to add sample data for your community. The application will use `localStorage` to temporarily persist any changes made during runtime (like creating new events), but these changes won't be saved back to the JSON files.

## Schema

### events.json
Should contain an array of Event objects matching the Event interface defined in `src/types/event.ts`.

Example:
```json
[
  {
    "id": "event-1",
    "details": {
      "eventName": "Hackathon 2024",
      "description": "Annual hackathon event",
      "format": "Team",
      "organizers": [],
      "coreParticipants": [],
      "date": {
        "start": "2024-03-15T09:00:00Z",
        "end": "2024-03-15T18:00:00Z"
      },
      "allowProjectSubmission": true
    },
    "status": "Approved",
    "requestedBy": "",
    "participants": [],
    "teams": [],
    "submissions": [],
    "criteria": []
  }
]
```

### students.json
Should contain an array of Student objects matching the Student interface defined in `src/types/student.ts`.

Example:
```json
[
  {
    "uid": "user-1",
    "email": "demo@example.com",
    "displayName": "Demo User",
    "isAdmin": true,
    "batch": 2024,
    "hasLaptop": true,
    "bio": "Demo user for testing"
  }
]
```
