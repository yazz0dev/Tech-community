# Migration Notes for Existing KSB Users

If you're migrating from the KSB-specific version to the generic version, here's what changed and how to update.

## Summary of Changes

This refactoring transforms the KSB Tech Community codebase into a generic, open-source platform that any tech community can use.

### Key Changes

1. **Configuration System** - All hardcoded references replaced with config
2. **Data Adapter Pattern** - Abstract data access layer supporting multiple backends
3. **Optional Firebase** - Firebase is now optional, not required
4. **Static JSON Support** - Can run without any database
5. **Generic Branding** - All KSB references replaced with configurable values

## Breaking Changes

### 1. Firebase Initialization

**Before:**
```typescript
import { db, auth } from '@/firebase';
// Always initialized
```

**After:**
```typescript
import { db, auth, isFirebaseEnabled } from '@/firebase';

if (isFirebaseEnabled()) {
  // Use Firebase
} else {
  // Fallback or use data adapter
}
```

### 2. Community References

**Before:**
```vue
<h1>Welcome to KSB Tech Community</h1>
```

**After:**
```vue
<script setup>
import { communityConfig } from '@/config/community.config';
</script>

<h1>Welcome to {{ communityConfig.name }}</h1>
```

### 3. Data Access

**Before:**
```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const snapshot = await getDocs(collection(db, 'events'));
```

**After (Recommended):**
```typescript
import { getDataAdapter } from '@/services/dataAdapter/IDataAdapter';

const adapter = await getDataAdapter();
const events = await adapter.getEvents();
```

**After (Firebase Direct - Still Works):**
```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '@/firebase';

if (isFirebaseEnabled() && db) {
  const snapshot = await getDocs(collection(db, 'events'));
}
```

## Migration Steps

### Step 1: Update Dependencies

No package changes needed. All dependencies remain the same.

### Step 2: Create .env File

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Configure your community:
```env
# Your Community Branding
VITE_COMMUNITY_NAME="KSB Tech Community"
VITE_COMMUNITY_SHORT_NAME="KSB"
VITE_COMMUNITY_EMAIL="info@ksbcommunity.edu"

# Use Firebase (existing setup)
VITE_DATA_SOURCE=firebase

# Your existing Firebase config
VITE_FIREBASE_API_KEY=your_existing_key
VITE_FIREBASE_AUTH_DOMAIN=your_existing_domain
# ... etc
```

### Step 3: Update Custom Code

If you have custom code that directly references KSB or hardcoded values:

1. **Search for hardcoded strings:**
```bash
grep -r "KSB" src/
grep -r "KMCT" src/
```

2. **Replace with config:**
```typescript
// Before
const title = "KSB Tech Community Platform";

// After
import { communityConfig } from '@/config/community.config';
const title = `${communityConfig.name} Platform`;
```

### Step 4: Test Firebase Connection

Ensure Firebase still works:

```bash
# Run dev server
npm run dev

# Check browser console for Firebase errors
# Navigate to http://localhost:5173
```

If you see Firebase errors, verify your `.env` has all Firebase credentials.

### Step 5: Optional - Migrate to Static Mode

To run without Firebase (for testing):

1. Export your Firebase data to JSON:
```bash
# Use Firebase CLI or custom script
firebase firestore:export public/data/
```

2. Convert to the expected format:
```json
// public/data/events.json
[
  { "id": "event1", "details": { ... } }
]

// public/data/students.json
[
  { "uid": "user1", "name": "...", "email": "..." }
]
```

3. Switch to static mode:
```env
VITE_DATA_SOURCE=static
```

## Backward Compatibility

The refactoring maintains backward compatibility:

- ✅ All existing Firebase code still works
- ✅ All existing views and components work
- ✅ All existing routes work
- ✅ All existing stores work
- ✅ All existing services work

**What's New:**
- ✨ Can now run without Firebase
- ✨ Configurable branding
- ✨ Data adapter pattern for flexibility
- ✨ Better documentation

## Troubleshooting

### Issue: "Firebase is not initialized"

**Solution:** Set `VITE_DATA_SOURCE=firebase` in `.env` and provide Firebase credentials.

### Issue: "Student type not found"

**Solution:** Use `StudentAppModel` instead of `Student`:
```typescript
import type { StudentAppModel } from '@/types/student';
```

### Issue: "Can't read property of null (Firebase)"

**Solution:** Check if Firebase is enabled:
```typescript
import { isFirebaseEnabled, auth } from '@/firebase';

if (isFirebaseEnabled() && auth) {
  // Use auth
}
```

### Issue: TypeScript errors after upgrade

**Solution:** Run type checking:
```bash
npm run type-check
```

Most type errors can be fixed by ensuring proper null checks.

## Rollback Plan

If you need to rollback:

1. **Keep your `.env` file** - It has your Firebase config
2. **Git revert** to previous commit:
```bash
git log --oneline  # Find commit before refactoring
git revert <commit-hash>
```

3. Or checkout the old branch:
```bash
git checkout main  # Or your previous branch
```

## Getting Help

- Check [Architecture](./architecture.md) for system overview
- See [Database Setup](./database-setup.md) for data configuration
- Review [Customization](./customization.md) for branding options
- Open GitHub Issues for problems

## Benefits of Upgrading

- 🚀 Run without database for development
- 🎨 Easy to rebrand for different communities
- 🔌 Flexible data sources (Firebase, static, custom)
- 📚 Better documentation
- 🧩 Modular architecture
- 🌍 Open source ready

## Next Steps

After migrating:

1. Test all features in development
2. Update any custom views/components
3. Consider running tests
4. Deploy to staging first
5. Monitor for issues
6. Deploy to production

## Community Support

KSB Tech Community continues to work as before. This refactoring makes it:
- Easier to maintain
- Easier to extend
- Usable by other communities
- Better documented

Your existing Firebase data, users, and events are unaffected. The platform is now just more flexible! 🎉
