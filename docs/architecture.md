# Architecture Overview

## Table of Contents
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Key Components](#key-components)
- [Design Patterns](#design-patterns)

## System Architecture

The Tech Community Platform is built as a Progressive Web Application (PWA) using Vue 3 with TypeScript. The architecture follows a modular, layered approach that separates concerns and allows for easy customization and extension.

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Vue Views   │  │  Components  │  │   Router     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Pinia Stores │  │ Composables  │  │   Services   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                     Data Access Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Data Adapter │  │  Firebase    │  │ Static JSON  │  │
│  │  Interface   │  │   Adapter    │  │   Adapter    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                      Data Storage                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Firestore  │  │  Static JSON │  │ localStorage │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework using Composition API
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Pinia** - State management library
- **Vue Router** - Client-side routing
- **Bootstrap 5** - CSS framework for responsive design
- **SCSS** - Enhanced CSS with variables and mixins

### Backend & Services (Optional)
- **Firebase Firestore** - NoSQL cloud database (optional)
- **Firebase Authentication** - User authentication (optional)
- **Firebase Storage** - File storage (optional)
- **Static JSON** - File-based data storage (default, no backend required)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vue TSC** - TypeScript checking for Vue
- **Vite PWA Plugin** - Progressive Web App features

## Data Flow

### With Static JSON (Default)
1. Application loads
2. StaticDataAdapter fetches JSON files from `/public/data/`
3. Data is cached in memory
4. Components access data through Pinia stores
5. Changes are optionally persisted to localStorage
6. No server connection required

### With Firebase
1. Application loads
2. Firebase is initialized with config
3. FirebaseDataAdapter queries Firestore
4. Real-time updates through Firestore listeners
5. Components access data through Pinia stores
6. Changes are persisted to Firestore
7. Requires internet connection and Firebase setup

## Key Components

### 1. Configuration Layer (`src/config/`)
- `community.config.ts` - Community branding and feature flags
- `database.config.ts` - Data source configuration

### 2. Data Adapter Layer (`src/services/dataAdapter/`)
- `IDataAdapter.ts` - Interface defining data operations
- `StaticDataAdapter.ts` - JSON file-based implementation
- `FirebaseDataAdapter.ts` - Firebase Firestore implementation

### 3. Service Layer (`src/services/`)
- `eventService/` - Event management logic
  - `eventCreation.ts` - Creating and requesting events
  - `eventManagement.ts` - Updating, deleting, status changes
  - `eventParticipation.ts` - Joining, leaving, submissions
  - `eventQueries.ts` - Fetching and filtering events
  - `eventTeams.ts` - Team management
  - `eventValidation.ts` - Validation logic
  - `eventVoting.ts` - Voting and winner selection
- `authService.ts` - Authentication logic
- `profileService.ts` - User profile management
- `xpService.ts` - Experience point calculations
- `storageService.ts` - File upload/download

### 4. Store Layer (`src/stores/`)
- `appStore.ts` - Global application state
- `eventStore.ts` - Event state management
- `profileStore.ts` - User profile state
- `notificationStore.ts` - In-app notifications

### 5. View Layer (`src/views/`)
- `LandingView.vue` - Landing page
- `HomeView.vue` - Dashboard
- `EventsListView.vue` - Event browsing
- `EventDetailsView.vue` - Event details and participation
- `RequestEventView.vue` - Event creation form
- `ProfileView.vue` - User profiles
- `LeaderboardView.vue` - XP rankings
- And more...

### 6. Component Layer (`src/components/`)
- `ui/` - Reusable UI components
- `forms/` - Form components
- `events/` - Event-specific components

## Design Patterns

### 1. Adapter Pattern
The application uses the Adapter pattern to abstract data access. This allows switching between different data sources (static JSON, Firebase, or custom backends) without changing business logic.

**Benefits:**
- Easy to add new data sources
- Business logic is decoupled from data storage
- Testing is simplified with mock adapters

### 2. Store Pattern (Pinia)
Centralized state management using Pinia stores:
- Single source of truth for application state
- Reactive data updates across components
- Organized by domain (events, profiles, notifications)

### 3. Composition API
Vue 3's Composition API for better code organization:
- Composables for reusable logic (`useEvents`, `useNotifications`)
- Type-safe with TypeScript
- Better code reuse than mixins

### 4. Service Layer Pattern
Business logic is separated into service modules:
- Services handle all data operations
- Stores orchestrate services
- Views/components remain lightweight

## Data Models

### Event Model
Events support three formats:
1. **Individual** - Single participant events
2. **Team** - Team-based collaborative events
3. **MultiEvent** - Multi-phase events with different stages

Event lifecycle: `Pending` → `Approved` → `Closed`

### User/Student Model
Users have roles:
- **Student** - Can join events, submit projects, earn XP
- **Admin** - Full platform management capabilities

### XP (Experience Points) System
Students earn XP through:
- Event participation
- Project submissions
- Team collaboration
- Criteria-based achievements

## Configuration System

The platform is highly configurable through environment variables:

1. **Community Branding** - Name, logo, colors, contact info
2. **Feature Flags** - Enable/disable features like PWA, XP system, teams
3. **Data Source** - Choose between static JSON or Firebase
4. **Theme** - Customize colors and styling

See `.env.example` for all available configuration options.

## Extensibility

### Adding a New Data Source
1. Implement the `IDataAdapter` interface
2. Add your adapter to the factory in `IDataAdapter.ts`
3. Update `database.config.ts` to support your source
4. No changes needed in business logic!

### Adding Custom Features
1. Create new service modules in `src/services/`
2. Add corresponding store in `src/stores/`
3. Create views and components
4. Add routes in `src/router/`
5. Update configuration if needed

### Customizing the UI
1. Update `community.config.ts` for branding
2. Modify SCSS variables in `src/styles/`
3. Replace components in `src/components/ui/`
4. Update views as needed

## Security Considerations

### With Static JSON
- No authentication by default
- All data is publicly accessible
- Use localStorage for client-side state
- Suitable for demos and testing

### With Firebase
- Firebase Authentication for user management
- Firestore security rules control access
- Role-based permissions (admin vs. student)
- Production-ready security

## Performance

### Optimizations
- Lazy loading of routes and components
- Image optimization and compression
- PWA caching strategies
- Virtualized lists for large datasets
- Code splitting with Vite

### Monitoring
- Error boundary handling
- Performance tracking
- User analytics (privacy-compliant)
- Real-time error reporting (when configured)

## Deployment

### Static JSON Mode
- Build with `npm run build`
- Deploy to any static hosting (Netlify, Vercel, GitHub Pages)
- No backend infrastructure required
- Zero ongoing costs

### Firebase Mode
- Build with `npm run build`
- Deploy to Firebase Hosting or any static host
- Configure Firebase project
- Ongoing costs depend on usage

## Next Steps

- Read [Getting Started](./getting-started.md) to set up the platform
- See [Database Setup](./database-setup.md) for data source configuration
- Check [Building Admin Panel](./building-admin-panel.md) to add admin features
- Review [Event Lifecycle](./event-lifecycle.md) for event management
