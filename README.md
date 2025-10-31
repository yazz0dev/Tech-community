# Tech Community Platform

An open-source web platform for tech communities, enabling members to participate in events, collaborate on projects, and grow together through hands-on learning experiences.

**Built with Vue 3 + TypeScript + Vite | Works with or without a database**

## 🚀 Features

### Core Features
- **Event Management**: Browse, create, join, and participate in tech events
- **Multiple Event Formats**: Support for Individual, Team, and Multi-Phase events
- **Project Submissions**: Submit and showcase projects for events
- **Team Collaboration**: Form teams and work together
- **XP System**: Earn experience points for participation and achievements (optional)
- **Profile Management**: Personal profiles with skills and bio
- **Real-time Updates**: Live synchronization when using Firebase (optional)

### Technical Highlights
- **No Database Required**: Runs with static JSON data out of the box
- **Database Flexible**: Easy integration with Firebase or custom backends
- **Fully Customizable**: Configure branding, colors, and features via environment variables
- **Progressive Web App (PWA)**: Installable with offline capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile
- **TypeScript**: Full type safety throughout the codebase
- **Modern Stack**: Vue 3 Composition API, Pinia, Vite

## 🛠️ Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe JavaScript for better DX
- **Vite** - Fast build tool and development server
- **Pinia** - Intuitive state management
- **Vue Router** - Client-side routing
- **Bootstrap 5** - Responsive CSS framework
- **SCSS** - Enhanced CSS with variables and mixins

### Data Layer (Flexible)
- **Static JSON** - Default, no backend required (perfect for getting started)
- **Firebase Firestore** - Optional NoSQL cloud database
- **Custom Database** - Easy to integrate your own backend via adapters

### Optional Services
- **Firebase Authentication** - User authentication
- **Firebase Storage** - File storage
- **OneSignal** - Push notifications

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vue TSC** - TypeScript checking for Vue
- **Vite PWA Plugin** - Progressive Web App features

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **pnpm** (comes with Node.js)
- **Git** - For cloning the repository
- **Firebase project** (optional, only if you want to use Firebase instead of static data)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/tech-community.git
cd tech-community
```

### 2. Install Dependencies
```bash
npm install
# or
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

# Use static data (no database required)
VITE_DATA_SOURCE=static
```

**That's it!** You're ready to run.

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. (Optional) Add Sample Data
Edit JSON files in `public/data/`:
- `events.json` - Add sample events
- `students.json` - Add demo users

See `public/data/README.md` for examples.

## 📚 Documentation

Comprehensive guides in the `docs/` folder:

- **[Getting Started](docs/getting-started.md)** - Detailed setup guide
- **[Architecture Overview](docs/architecture.md)** - System design and structure
- **[Database Setup](docs/database-setup.md)** - Configure data sources (Static JSON, Firebase, or Custom)
- **[Event Lifecycle](docs/event-lifecycle.md)** - How events work, including multi-event support
- **[Building Admin Panel](docs/building-admin-panel.md)** - Create admin interfaces
- **[Student Signup Feature](docs/student-signup-feature.md)** - User registration system

## 🏗️ Project Structure

```
tech-community/
├── public/
│   ├── data/              # Static JSON data files (default data source)
│   │   ├── events.json
│   │   ├── students.json
│   │   └── README.md
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable Vue components
│   │   ├── ui/           # UI components (buttons, cards, etc.)
│   │   └── forms/        # Form components
│   ├── views/            # Page components
│   ├── stores/           # Pinia store modules
│   ├── services/         # Business logic and API
│   │   ├── dataAdapter/  # Data access abstraction layer
│   │   └── eventService/ # Event management services
│   ├── config/           # Configuration files
│   │   ├── community.config.ts  # Community branding
│   │   └── database.config.ts   # Data source configuration
│   ├── composables/      # Vue composition functions
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # SCSS stylesheets
│   └── router/           # Vue Router configuration
├── docs/                 # Comprehensive documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── database-setup.md
│   ├── event-lifecycle.md
│   └── building-admin-panel.md
├── .env.example          # Environment variables template
└── package.json
```

## 🎯 Key Features Explained

### Event Management

Events support three formats with complete lifecycle management:

#### 1. **Individual Events**
- Single participants work independently
- Personal project submissions
- Individual winner selection

#### 2. **Team Events**
- Collaborative team-based activities
- Automatic or manual team formation
- Team submissions and winners

#### 3. **MultiEvent (Multi-Phase)**
- Complex events with multiple stages
- Each phase can be Individual or Team based
- Different criteria per phase
- Progressive competitions (e.g., Ideation → Development → Presentation)

**Event Lifecycle:**
```
Pending → Approved → Closed
```

- **Pending**: Awaits admin approval
- **Approved**: Active, accepting participants
- **Closed**: Completed, winner selection enabled

### Data Flexibility

The platform uses an **Adapter Pattern** for data access:

**Static JSON Mode (Default)**
- No database setup required
- Perfect for development and testing
- Data stored in `public/data/` JSON files
- Changes persist in browser localStorage

**Firebase Mode (Optional)**
- Cloud-based data storage
- Real-time synchronization
- Built-in authentication
- Production-ready

**Custom Database (Extensible)**
- Implement `IDataAdapter` interface
- Connect to any backend
- Use your preferred database

### Customization

Everything is configurable via `.env`:

```env
# Branding
VITE_COMMUNITY_NAME="Your Tech Community"
VITE_COMMUNITY_SHORT_NAME="YourTech"
VITE_COMMUNITY_TAGLINE="Learn, Build, Grow"

# Theme
VITE_THEME_PRIMARY_COLOR="#0d6efd"
VITE_THEME_SECONDARY_COLOR="#6c757d"

# Features (enable/disable)
VITE_ENABLE_XP_SYSTEM=true
VITE_ENABLE_TEAMS=true
VITE_ENABLE_PROJECTS=true

# Data Source
VITE_DATA_SOURCE=static  # or 'firebase'
```

## 🔧 Development

### Available Scripts
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Type checking with watch mode
npm run type-check:watch
```

### Development Tips

1. **Use Static Mode First**: Start with `VITE_DATA_SOURCE=static` for rapid development
2. **Hot Module Replacement**: Changes update instantly in dev mode
3. **Vue DevTools**: Install browser extension for debugging
4. **TypeScript**: Enable strict mode for better type safety
5. **Data Adapters**: Business logic is database-agnostic

### Adding Features

The modular architecture makes it easy to extend:

1. **New Data Source**: Implement `IDataAdapter` interface
2. **Custom Event Types**: Extend event types in `src/types/event.ts`
3. **UI Customization**: Modify components in `src/components/`
4. **New Routes**: Add to `src/router/index.ts`

## 🚀 Deployment

### Static Hosting (Recommended for Static Mode)

Works with any static hosting service:

**Netlify:**
```bash
npm run build
# Deploy dist/ folder via Netlify UI or CLI
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
npm run build
vercel --prod
```

**GitHub Pages:**
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

### Firebase Hosting (For Firebase Mode)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Environment Variables

For production, set environment variables in your hosting platform:
- Netlify: Site settings → Environment variables
- Vercel: Project settings → Environment variables
- Firebase: Use `.env.production`

## 🔐 Security

### Static Mode
- No authentication by default
- All data publicly accessible
- Suitable for demos and non-sensitive use cases
- Can add custom auth layer

### Firebase Mode
- Built-in authentication
- Firestore security rules
- Role-based access control (admin vs. user)
- Production-ready security

**Important:** Always implement proper security rules in production!

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run type checking (`npm run type-check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Write TypeScript interfaces for all data structures
- Add proper error handling and loading states
- Test on both desktop and mobile viewports
- Follow existing code patterns and naming conventions
- Update documentation for new features
- Keep changes minimal and focused

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support & Community

- **Documentation**: Check the `docs/` folder for comprehensive guides
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/tech-community/issues)
- **Discussions**: Ask questions on [GitHub Discussions](https://github.com/yourusername/tech-community/discussions)
- **Examples**: See `public/data/README.md` for data structure examples

## 🌟 Features Roadmap

- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Custom event types
- [ ] Integration with external APIs
- [ ] Mobile native apps
- [ ] Plugin system for extensions

## 💡 Use Cases

This platform is perfect for:
- **University tech clubs** - Manage events and hackathons
- **Coding bootcamps** - Track student progress
- **Tech communities** - Organize meetups and workshops
- **Corporate teams** - Internal tech events
- **Educational institutions** - Course projects and competitions

## 🙏 Acknowledgments

- Built with Vue 3, TypeScript, and Vite
- UI powered by Bootstrap 5
- Icons by Font Awesome
- Inspired by the needs of tech communities worldwide

---

**Ready to build your tech community? Get started now!** 🚀

For questions or support, reach out via GitHub Issues or Discussions.
