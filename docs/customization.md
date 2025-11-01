# Customization Guide

## Overview

This guide explains how to customize the Tech Community Platform to match your community's branding, requirements, and preferences.

## Configuration Files

### Environment Variables (`.env`)

Create a `.env` file based on `.env.example`:

```env
# Community Branding
VITE_COMMUNITY_NAME="Your Tech Community"
VITE_COMMUNITY_SHORT_NAME="YourTech"
VITE_COMMUNITY_DESCRIPTION="A platform for tech enthusiasts"
VITE_COMMUNITY_TAGLINE="Learn, Build, and Grow Together"
VITE_COMMUNITY_EMAIL="info@yourtechcommunity.dev"
VITE_COMMUNITY_WEBSITE="https://yourtechcommunity.dev"
VITE_COMMUNITY_LOGO="https://yourdomain.com/logo.png"

# Theme Colors
VITE_THEME_PRIMARY_COLOR="#0d6efd"
VITE_THEME_SECONDARY_COLOR="#6c757d"

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_XP_SYSTEM=true
VITE_ENABLE_TEAMS=true
VITE_ENABLE_PROJECTS=true

# Data Source
VITE_DATA_SOURCE=static  # or 'firebase' or 'custom'

# Firebase (optional, only if using Firebase)
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# VITE_FIREBASE_PROJECT_ID=...
# VITE_FIREBASE_STORAGE_BUCKET=...
# VITE_FIREBASE_MESSAGING_SENDER_ID=...
# VITE_FIREBASE_APP_ID=...
```

### Community Config (`src/config/community.config.ts`)

All community-specific settings are centralized here:

```typescript
export const communityConfig: CommunityConfig = {
  name: import.meta.env.VITE_COMMUNITY_NAME || 'Tech Community',
  shortName: import.meta.env.VITE_COMMUNITY_SHORT_NAME || 'TechComm',
  // ... other settings
};
```

## Branding Customization

### 1. Community Name and Logo

Update `.env`:
```env
VITE_COMMUNITY_NAME="Silicon Valley Tech Collective"
VITE_COMMUNITY_SHORT_NAME="SVTC"
VITE_COMMUNITY_LOGO="https://yourcdn.com/logo.png"
```

The name appears in:
- Browser title
- Navigation bar
- Meta tags for SEO
- Social media sharing

### 2. Colors and Theme

Update theme colors:
```env
VITE_THEME_PRIMARY_COLOR="#FF6B6B"
VITE_THEME_SECONDARY_COLOR="#4ECDC4"
```

For more advanced theming, edit `src/styles/_variables.scss`:
```scss
// Override Bootstrap variables
$primary: #FF6B6B;
$secondary: #4ECDC4;
$success: #95E1D3;
// ... other colors
```

### 3. Fonts

To change fonts, edit `src/styles/main.scss`:
```scss
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

### 4. Favicon and PWA Icons

Replace files in `public/`:
- `favicon.ico` - Browser favicon
- `logo.png` - Main logo
- Update `public/manifest.json` with your app name and icons

## Feature Customization

### Enable/Disable Features

Control features via `.env`:

```env
# Disable XP system
VITE_ENABLE_XP_SYSTEM=false

# Disable team features
VITE_ENABLE_TEAMS=false

# Disable project submissions
VITE_ENABLE_PROJECTS=false
```

Access in code:
```typescript
import { communityConfig } from '@/config/community.config';

if (communityConfig.features.enableXPSystem) {
  // Show XP-related UI
}
```

### Add Custom Event Types

Edit `src/utils/eventTypes.ts` to add custom event types:

```typescript
export const EVENT_TYPES = [
  'Hackathon',
  'Workshop',
  'Webinar',
  'Code Review Session',  // Custom type
  'Tech Talk',             // Custom type
  // ... more types
];
```

## Content Customization

### 1. Landing Page

Edit `src/views/LandingView.vue`:

```vue
<template>
  <div class="hero">
    <h1>Welcome to {{ communityConfig.name }}</h1>
    <p>{{ communityConfig.tagline }}</p>
  </div>
</template>
```

### 2. About Section

Update the about section in `LandingView.vue`:
```vue
<section class="about">
  <h2>About Us</h2>
  <p>
    Your custom description about your tech community...
  </p>
</section>
```

### 3. Footer

Edit `src/components/ui/Footer.vue` (if exists) or the footer in `LandingView.vue`:
```vue
<footer>
  <p>&copy; {{ year }} {{ communityConfig.name }}</p>
  <a :href="`mailto:${communityConfig.email}`">Contact Us</a>
</footer>
```

## Navigation Customization

### Add/Remove Menu Items

Edit `src/components/ui/TopBar.vue`:

```vue
<li class="nav-item">
  <router-link to="/custom-page">
    Custom Page
  </router-link>
</li>
```

Add corresponding route in `src/router/index.ts`:
```typescript
{
  path: '/custom-page',
  name: 'CustomPage',
  component: () => import('@/views/CustomPageView.vue'),
  meta: { requiresAuth: false }
}
```

## Data Customization

### Static Data

Edit JSON files in `public/data/`:

**events.json** - Sample events:
```json
[
  {
    "id": "welcome-2024",
    "details": {
      "eventName": "Welcome Meetup 2024",
      "description": "Join us for our kickoff event!",
      "format": "Individual",
      "date": {
        "start": "2024-12-15T18:00:00Z",
        "end": "2024-12-15T20:00:00Z"
      }
    }
  }
]
```

**students.json** - Demo users:
```json
[
  {
    "uid": "admin-1",
    "name": "Admin User",
    "email": "admin@yourdomain.com",
    "isAdmin": true
  }
]
```

## Advanced Customization

### Custom Data Source

Create a custom data adapter:

1. Create `src/services/dataAdapter/MyCustomAdapter.ts`:
```typescript
import type { IDataAdapter } from './IDataAdapter';

export class MyCustomDataAdapter implements IDataAdapter {
  // Implement all IDataAdapter methods
  async getEvents() { /* ... */ }
  async getEvent(id) { /* ... */ }
  // ... etc
}
```

2. Register in `IDataAdapter.ts`:
```typescript
else if (databaseConfig.dataSource === 'custom') {
  const { MyCustomDataAdapter } = await import('./MyCustomDataAdapter');
  adapterInstance = new MyCustomDataAdapter();
}
```

3. Update `.env`:
```env
VITE_DATA_SOURCE=custom
```

### Custom Authentication

To integrate custom auth (e.g., Auth0, Okta):

1. Create `src/services/auth/CustomAuthProvider.ts`
2. Update `src/composables/useAuth.ts` to use your provider
3. Modify login/signup views

### Custom Analytics

Add analytics in `src/main.ts`:
```typescript
import { analytics } from './analytics';

router.afterEach((to) => {
  analytics.trackPageView(to.path);
});
```

## Deployment Customization

### Custom Domain

Update in `.env`:
```env
VITE_COMMUNITY_WEBSITE="https://yourdomain.com"
```

Configure your hosting:
- **Netlify**: Add custom domain in site settings
- **Vercel**: Add domain in project settings
- **Firebase**: `firebase hosting:sites:list` and configure

### Environment-Specific Builds

Create multiple env files:
- `.env.development`
- `.env.staging`
- `.env.production`

Build with specific env:
```bash
# Development
npm run dev

# Staging
NODE_ENV=staging npm run build

# Production
npm run build
```

## Localization (Future Enhancement)

To add multi-language support:

1. Install i18n: `npm install vue-i18n`
2. Create locale files in `src/locales/`
3. Configure in `src/main.ts`
4. Use in components: `$t('key')`

## SEO Customization

Update meta tags in `src/router/index.ts`:
```typescript
{ 
  path: '/events',
  meta: { 
    title: 'Events',
    description: 'Explore amazing tech events in our community',
    keywords: 'tech, events, hackathons, workshops'
  }
}
```

## Component Library

Replace Bootstrap with another framework:

1. Uninstall Bootstrap: `npm uninstall bootstrap`
2. Install alternative: `npm install vuetify` or `npm install element-plus`
3. Update imports in components
4. Update styling

## Best Practices

1. **Keep .env files private** - Never commit to Git
2. **Test changes locally** - Use `npm run dev`
3. **Document customizations** - Add comments in code
4. **Version control** - Commit changes incrementally
5. **Backup data** - Export JSON files before major changes
6. **Test responsiveness** - Check mobile and desktop views
7. **Performance** - Monitor build size and load times

## Getting Help

- Review [Architecture Documentation](./architecture.md)
- Check [Getting Started Guide](./getting-started.md)
- Open GitHub Issues for bugs
- Join community discussions

## Example: Complete Rebranding

Here's a complete example of rebranding for "CodeCraft Community":

**.env**
```env
VITE_COMMUNITY_NAME="CodeCraft Community"
VITE_COMMUNITY_SHORT_NAME="CodeCraft"
VITE_COMMUNITY_TAGLINE="Craft Your Code, Build Your Future"
VITE_COMMUNITY_EMAIL="hello@codecraft.dev"
VITE_COMMUNITY_WEBSITE="https://codecraft.dev"
VITE_THEME_PRIMARY_COLOR="#6C63FF"
VITE_THEME_SECONDARY_COLOR="#FF6584"
```

**public/manifest.json**
```json
{
  "name": "CodeCraft Community",
  "short_name": "CodeCraft",
  "description": "Craft Your Code, Build Your Future",
  "theme_color": "#6C63FF"
}
```

**public/data/events.json**
```json
[
  {
    "id": "codecraft-2024",
    "details": {
      "eventName": "CodeCraft Summit 2024",
      "description": "Annual coding summit"
    }
  }
]
```

Build and deploy:
```bash
npm run build
netlify deploy --prod
```

Your CodeCraft Community platform is live! 🎉
