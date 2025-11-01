# Student Self-Signup Feature

> **Note:** This feature documentation is specific to the student signup system. For general platform documentation, see the main [docs/](../) folder.

## Overview

The Student Self-Signup feature allows students to register for the Tech Community using admin-generated signup links. This creates a controlled registration process where students submit their information for admin approval before gaining access to the platform.

## How It Works

### 1. Admin Generates Signup Links

Admins can create signup links in two formats:

**Batch-based links:**
```
https://yourstudentapp.com/signup?batch=2024
```

**Token-based links:**
```
https://yourstudentapp.com/signup?token=abc123xyz789...
```

### 2. Student Registration Process

1. Student clicks on the admin-provided signup link
2. System validates the link and extracts batch information
3. Student fills out the registration form with:
   - Full Name (required)
   - Email Address (required)
   - Student ID (required)
   - Batch Year Confirmation (required)
   - Laptop availability (required)
   - Skills (optional)
   - Bio (optional)
   - Terms agreement (required)

4. System validates the submission and checks for duplicates
5. Registration data is saved to `signup` collection
6. Student receives confirmation message

### 3. Admin Approval Process

- Pending registrations are stored with status `pending_approval`
- Admins can review and approve/reject registrations
- Upon approval, Firebase Auth accounts are created
- Students are notified via email when approved

## Technical Implementation

### New Files Created

1. **`src/views/StudentSignupView.vue`** - Main signup form component
2. **`src/types/signup.ts`** - TypeScript interfaces
3. **`src/utils/signupUtils.ts`** - Utility functions for link generation and validation
4. **Route added to `src/router/index.ts`** - `/signup` route

### Firestore Collections

#### `signup/{batchYear}` (Batch Configuration)
Stores batch signup configuration and controls:
```typescript
{
  batchYear: number;
  active: boolean; // Whether signup is currently active for this batch
  createdAt: Timestamp;
  createdBy: string; // Admin user ID who created/activated this batch
  activatedAt?: Timestamp; // When this batch was last activated
  deactivatedAt?: Timestamp; // When this batch was last deactivated
  maxRegistrations?: number; // Optional limit on registrations for this batch
  currentRegistrations: number; // Current count of registrations
  description?: string; // Optional description for this batch
  notes?: string; // Admin notes about this batch
}
```

#### `signup/{batchYear}/{registrationId}` (Individual Registrations)
Stores individual student registration submissions within each batch:
```typescript
{
  fullName: string;
  email: string;
  studentId: string;
  batchYear: number;
  hasLaptop: boolean;
  bio?: string;
  skills?: string[];
  status: 'pending_approval' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  processedAt?: Timestamp;
  processedBy?: string;
  rejectionReason?: string;
  signupSource: {
    batch?: number;
    token?: string;
    userAgent?: string;
    referrer?: string;
  };
  notes?: string;
}
```

#### `signupLinks` (Optional)
For tracking token-based signup links:
```typescript
{
  batchYear: number;
  token?: string;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  expiresAt?: Timestamp;
  maxUses?: number;
  currentUses: number;
  description?: string;
}
```

### Key Features

- **Link Validation**: Validates both batch-based and token-based signup links
- **Duplicate Prevention**: Checks for existing registrations by email and student ID
- **Form Validation**: Comprehensive client-side validation
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Clear error messages and loading states
- **Security**: No Firebase Auth account created until admin approval

### Usage Examples

#### Creating Batch Links (Admin)
```typescript
import { createBatchSignupLink } from '@/utils/signupUtils';

const link = createBatchSignupLink(2024);
// Returns: "https://yourdomain.com/signup?batch=2024"
```

#### Creating Token Links (Admin)
```typescript
import { generateSignupToken, createTokenSignupLink } from '@/utils/signupUtils';

const token = generateSignupToken();
const link = createTokenSignupLink(token);
// Returns: "https://yourdomain.com/signup?token=abc123..."
```

## Security Considerations

1. **No Auth Account Creation**: Students cannot access the platform until approved
2. **Link Validation**: Token-based links can have expiration dates and usage limits
3. **Duplicate Prevention**: Prevents multiple registrations with same email/student ID
4. **Admin Control**: All registrations require admin approval
5. **Audit Trail**: Tracks signup source and submission metadata

## Future Enhancements

1. **Email Notifications**: Automatic emails to students upon approval/rejection
2. **Bulk Approval**: Admin interface for batch processing registrations
3. **Link Analytics**: Track link usage and conversion rates
4. **Custom Fields**: Configurable form fields per batch
5. **Integration**: Connect with existing student information systems

## Testing

To test the feature:

1. Navigate to `/signup?batch=2024` (replace 2024 with desired batch year)
2. Fill out the registration form
3. Check Firestore `signup` collection for the submission
4. Verify duplicate prevention by trying to register with same email/student ID

## Deployment Notes

- Ensure Firestore security rules allow writes to `signup`
- Configure email templates for approval notifications
- Set up admin interface for managing pending registrations
- Consider implementing rate limiting for signup submissions

## Admin Utilities

The `signupUtils.ts` file provides several utility functions for managing signup links and batch configurations:

### Signup Link Management
- `createBatchSignupLink(batchYear, baseUrl)` - Creates a batch-based signup URL
- `createTokenSignupLink(token, baseUrl)` - Creates a token-based signup URL  
- `validateSignupToken(token)` - Validates a signup token
- `isValidBatchYear(year)` - Checks if a batch year is valid
- `formatSignupLinkForDisplay(batchYear, token, baseUrl)` - Formats links for display

### Batch Configuration Management
- `isBatchSignupActive(batchYear)` - Checks if signup is active for a specific batch
- `getBatchSignupConfig(batchYear)` - Retrieves batch configuration
- `createOrUpdateBatchConfig(batchYear, adminUserId, options)` - Creates or updates batch settings
- `getBatchRegistrationsPath(batchYear)` - Gets the Firestore path for batch registrations
- `incrementBatchRegistrationCount(batchYear)` - Increments the registration counter for a batch

### Example: Activating Batch Signup
```typescript
import { createOrUpdateBatchConfig } from '@/utils/signupUtils';

// Activate signup for batch 2024
await createOrUpdateBatchConfig(2024, 'admin-user-id', {
  active: true,
  maxRegistrations: 50,
  description: 'MCA Batch 2024 Registration'
});

// Deactivate signup for batch 2023
await createOrUpdateBatchConfig(2023, 'admin-user-id', {
  active: false
});
``` 