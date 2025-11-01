# Getting Started

## Quick Start Guide

This guide will help you set up and run the Tech Community Platform in under 5 minutes.

## Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** or **pnpm** (comes with Node.js)
- **Git** (for cloning the repository)
- A modern web browser

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/tech-community.git
cd tech-community
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using pnpm (recommended for faster installs):
```bash
pnpm install
```

### 3. Configure Your Community

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` to customize your community:
```env
VITE_COMMUNITY_NAME="Your Tech Community"
VITE_COMMUNITY_SHORT_NAME="YourTech"
VITE_COMMUNITY_EMAIL="info@yourtechcommunity.dev"
# ... other settings
```

**Note:** The default configuration uses static JSON data, so you don't need to set up a database!

### 4. Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

## Project Structure

```
tech-community/
├── public/
│   ├── data/              # Static JSON data files
│   │   ├── events.json
│   │   └── students.json
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable Vue components
│   ├── views/            # Page components
│   ├── stores/           # Pinia state management
│   ├── services/         # Business logic
│   │   └── dataAdapter/  # Data access layer
│   ├── config/           # Configuration files
│   ├── router/           # Vue Router setup
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   └── styles/           # SCSS stylesheets
├── docs/                 # Documentation
├── .env.example          # Environment variables template
└── package.json
```

## Running Without a Database

By default, the platform runs with static JSON data stored in `public/data/`. This is perfect for:
- Getting started quickly
- Testing and demos
- Small communities
- Learning how the platform works

### Adding Sample Data

Edit the JSON files in `public/data/`:

**events.json** - Add sample events:
```json
[
  {
    "id": "event-1",
    "details": {
      "eventName": "Kickoff Meetup",
      "description": "Welcome to our tech community!",
      "format": "Individual",
      "organizers": [],
      "coreParticipants": [],
      "date": {
        "start": "2024-12-01T18:00:00Z",
        "end": "2024-12-01T20:00:00Z"
      },
      "allowProjectSubmission": false
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

**students.json** - Add demo users:
```json
[
  {
    "uid": "demo-admin",
    "email": "admin@demo.com",
    "displayName": "Demo Admin",
    "isAdmin": true,
    "batch": 2024,
    "hasLaptop": true,
    "bio": "Administrator account"
  },
  {
    "uid": "demo-user",
    "email": "user@demo.com",
    "displayName": "Demo User",
    "isAdmin": false,
    "batch": 2024,
    "hasLaptop": true,
    "bio": "Regular user account"
  }
]
```

### How Static Mode Works

1. On startup, the app loads JSON files from `public/data/`
2. Data is cached in memory for fast access
3. Any changes (like creating events) are stored in `localStorage`
4. Changes persist across browser sessions but won't be in the JSON files
5. No server or database connection required!

## Customizing Your Community

### Branding

Edit `.env` to customize:
- Community name and tagline
- Contact email and website
- Theme colors
- Logo URL

Changes will be reflected immediately in development mode.

### Features

Enable or disable features in `.env`:
```env
VITE_ENABLE_PWA=true              # Progressive Web App
VITE_ENABLE_NOTIFICATIONS=true    # Push notifications
VITE_ENABLE_XP_SYSTEM=true       # Experience points
VITE_ENABLE_TEAMS=true           # Team collaboration
VITE_ENABLE_PROJECTS=true        # Project submissions
```

### Styling

Customize the look and feel:
1. Edit SCSS variables in `src/styles/`
2. Modify Bootstrap theme in `src/styles/_variables.scss`
3. Update component styles as needed

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Type checking with watch mode
npm run type-check:watch
```

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### 2. Test the Production Build

```bash
npm run preview
```

### 3. Deploy

Deploy the `dist/` folder to any static hosting service:

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**GitHub Pages:**
```bash
# Push dist/ to gh-pages branch
npm run build
git add dist -f
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

## Next Steps

Now that you have the platform running:

1. **Explore the Features** - Browse events, create profiles, manage teams
2. **Customize Branding** - Make it your own with colors and logos
3. **Add Sample Data** - Populate with events and users for testing
4. **Connect a Database** - Read [Database Setup](./database-setup.md) when ready
5. **Build Admin Features** - See [Building Admin Panel](./building-admin-panel.md)
6. **Understand Events** - Learn about [Event Lifecycle](./event-lifecycle.md)

## Common Issues

### Port Already in Use
If port 5173 is in use:
```bash
npm run dev -- --port 3000
```

### Build Errors
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
Run type checking to identify issues:
```bash
npm run type-check
```

### Static Data Not Loading
Ensure JSON files are valid:
```bash
# Check JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('public/data/events.json')))"
```

## Getting Help

- **Documentation** - Check other docs in the `docs/` folder
- **Issues** - Report bugs on GitHub Issues
- **Community** - Join discussions on GitHub Discussions
- **Examples** - See `public/data/README.md` for data examples

## Development Tips

1. **Hot Module Replacement** - Changes update instantly in dev mode
2. **Vue DevTools** - Install browser extension for debugging
3. **TypeScript** - Use strict mode for better type safety
4. **Console Logs** - Check browser console for errors
5. **Network Tab** - Monitor API calls and data loading

## What's Next?

Once you're comfortable with the basics:
- Set up Firebase for production use
- Build custom admin panels
- Add custom event types
- Extend with new features
- Deploy to production

Happy coding! 🚀
