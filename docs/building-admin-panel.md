# Building an Admin Panel

## Overview

This guide explains how to build a comprehensive admin panel for managing your tech community platform. The platform provides all the necessary services and components - you just need to create the UI and wire everything together.

## Table of Contents
- [Admin Features Overview](#admin-features-overview)
- [Setting Up Admin Routes](#setting-up-admin-routes)
- [Event Management](#event-management)
- [User Management](#user-management)
- [Analytics Dashboard](#analytics-dashboard)
- [Permissions System](#permissions-system)

## Admin Features Overview

The admin panel should provide:
1. **Event Management** - Approve/reject events, close events, manage participants
2. **User Management** - View users, approve registrations, grant admin rights
3. **Content Moderation** - Review submissions, moderate content
4. **Analytics** - View statistics, engagement metrics, trends
5. **XP Management** - Award points, manage criteria
6. **Settings** - Configure community settings

## Setting Up Admin Routes

### 1. Create Admin Layout

Create `src/layouts/AdminLayout.vue`:

```vue
<template>
  <div class="admin-layout">
    <nav class="admin-sidebar">
      <div class="sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link to="/admin/dashboard" class="nav-link">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/events" class="nav-link">
            <i class="fas fa-calendar"></i> Events
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/users" class="nav-link">
            <i class="fas fa-users"></i> Users
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/analytics" class="nav-link">
            <i class="fas fa-chart-line"></i> Analytics
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/settings" class="nav-link">
            <i class="fas fa-cog"></i> Settings
          </router-link>
        </li>
      </ul>
    </nav>
    <main class="admin-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 1rem;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  background: #f8f9fa;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.router-link-active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
}
</style>
```

### 2. Add Admin Routes

Update `src/router/index.ts`:

```typescript
const routes = [
  // ... existing routes ...
  
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: 'Admin Dashboard' }
      },
      {
        path: 'events',
        name: 'AdminEvents',
        component: () => import('@/views/admin/EventsView.vue'),
        meta: { title: 'Manage Events' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersView.vue'),
        meta: { title: 'Manage Users' }
      },
      {
        path: 'analytics',
        name: 'AdminAnalytics',
        component: () => import('@/views/admin/AnalyticsView.vue'),
        meta: { title: 'Analytics' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/SettingsView.vue'),
        meta: { title: 'Settings' }
      }
    ]
  }
];

// Add admin check to router guard
router.beforeEach((to, from, next) => {
  const profileStore = useProfileStore();
  
  if (to.meta.requiresAdmin && !profileStore.isAdmin) {
    next('/home');
    return;
  }
  
  next();
});
```

## Event Management

### Admin Events View

Create `src/views/admin/EventsView.vue`:

```vue
<template>
  <div class="admin-events">
    <div class="page-header d-flex justify-content-between align-items-center mb-4">
      <h1>Event Management</h1>
      <button @click="refreshEvents" class="btn btn-primary">
        <i class="fas fa-sync"></i> Refresh
      </button>
    </div>

    <!-- Event Filters -->
    <div class="filters mb-4">
      <div class="btn-group" role="group">
        <button 
          v-for="status in ['All', 'Pending', 'Approved', 'Closed']" 
          :key="status"
          @click="filterStatus = status"
          :class="['btn', filterStatus === status ? 'btn-primary' : 'btn-outline-primary']"
        >
          {{ status }}
          <span class="badge bg-light text-dark ms-2">
            {{ getEventCountByStatus(status) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Pending Events (Require Approval) -->
    <div v-if="pendingEvents.length > 0" class="card mb-4 border-warning">
      <div class="card-header bg-warning text-dark">
        <h5 class="mb-0">
          <i class="fas fa-clock"></i> Pending Approval ({{ pendingEvents.length }})
        </h5>
      </div>
      <div class="card-body">
        <div v-for="event in pendingEvents" :key="event.id" class="event-card mb-3">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6>{{ event.details.eventName }}</h6>
              <p class="text-muted small mb-2">{{ event.details.description }}</p>
              <div class="event-meta">
                <span class="badge bg-secondary me-2">{{ event.details.format }}</span>
                <span class="text-muted small">
                  Requested by: {{ getStudentName(event.requestedBy) }}
                </span>
              </div>
            </div>
            <div class="event-actions">
              <button 
                @click="approveEvent(event.id)" 
                class="btn btn-sm btn-success me-2"
                :disabled="loading"
              >
                <i class="fas fa-check"></i> Approve
              </button>
              <button 
                @click="rejectEvent(event.id)" 
                class="btn btn-sm btn-danger"
                :disabled="loading"
              >
                <i class="fas fa-times"></i> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Events -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">All Events</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Format</th>
                <th>Status</th>
                <th>Participants</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in filteredEvents" :key="event.id">
                <td>
                  <router-link :to="`/events/${event.id}`">
                    {{ event.details.eventName }}
                  </router-link>
                </td>
                <td>
                  <span class="badge bg-info">{{ event.details.format }}</span>
                </td>
                <td>
                  <span :class="getStatusBadgeClass(event.status)">
                    {{ event.status }}
                  </span>
                </td>
                <td>{{ event.participants?.length || 0 }}</td>
                <td>{{ formatDate(event.details.date.start) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button 
                      v-if="event.status === 'Approved'"
                      @click="closeEvent(event.id)" 
                      class="btn btn-warning"
                      :disabled="loading"
                    >
                      <i class="fas fa-lock"></i> Close
                    </button>
                    <button 
                      @click="editEvent(event.id)" 
                      class="btn btn-primary"
                    >
                      <i class="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      @click="deleteEvent(event.id)" 
                      class="btn btn-danger"
                      :disabled="loading"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventStore } from '@/stores/eventStore';
import { useProfileStore } from '@/stores/profileStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { EventStatus } from '@/types/event';

const eventStore = useEventStore();
const profileStore = useProfileStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const filterStatus = ref('All');

const pendingEvents = computed(() => 
  eventStore.allPubliclyViewableEvents.filter(e => e.status === EventStatus.Pending)
);

const filteredEvents = computed(() => {
  if (filterStatus.value === 'All') return eventStore.allPubliclyViewableEvents;
  return eventStore.allPubliclyViewableEvents.filter(
    e => e.status === filterStatus.value
  );
});

async function approveEvent(eventId: string) {
  loading.value = true;
  try {
    await eventStore.updateEventStatus(eventId, EventStatus.Approved);
    notificationStore.addNotification('Event approved successfully', 'success');
  } catch (error) {
    notificationStore.addNotification('Failed to approve event', 'error');
  } finally {
    loading.value = false;
  }
}

async function rejectEvent(eventId: string) {
  if (!confirm('Are you sure you want to reject this event?')) return;
  
  loading.value = true;
  try {
    await eventStore.deleteEventRequest(eventId);
    notificationStore.addNotification('Event rejected', 'success');
  } catch (error) {
    notificationStore.addNotification('Failed to reject event', 'error');
  } finally {
    loading.value = false;
  }
}

async function closeEvent(eventId: string) {
  if (!confirm('Close this event? Participants will no longer be able to join.')) return;
  
  loading.value = true;
  try {
    await eventStore.closeEvent(eventId);
    notificationStore.addNotification('Event closed successfully', 'success');
  } catch (error) {
    notificationStore.addNotification('Failed to close event', 'error');
  } finally {
    loading.value = false;
  }
}

async function deleteEvent(eventId: string) {
  if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
  
  loading.value = true;
  try {
    await eventStore.deleteEventRequest(eventId);
    notificationStore.addNotification('Event deleted', 'success');
  } catch (error) {
    notificationStore.addNotification('Failed to delete event', 'error');
  } finally {
    loading.value = false;
  }
}

function editEvent(eventId: string) {
  // Navigate to edit page
  // router.push(`/admin/events/${eventId}/edit`);
}

function getEventCountByStatus(status: string) {
  if (status === 'All') return eventStore.allPubliclyViewableEvents.length;
  return eventStore.allPubliclyViewableEvents.filter(e => e.status === status).length;
}

function getStatusBadgeClass(status: string) {
  const classes = {
    'Pending': 'badge bg-warning',
    'Approved': 'badge bg-success',
    'Closed': 'badge bg-secondary'
  };
  return classes[status] || 'badge bg-secondary';
}

function getStudentName(uid: string) {
  // Implement student name lookup
  return uid;
}

function formatDate(date: any) {
  // Implement date formatting
  return new Date(date).toLocaleDateString();
}

async function refreshEvents() {
  loading.value = true;
  try {
    await eventStore.fetchPubliclyViewableEvents();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  refreshEvents();
});
</script>

<style scoped lang="scss">
.event-card {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: white;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
```

## User Management

### Admin Users View

Create `src/views/admin/UsersView.vue`:

```vue
<template>
  <div class="admin-users">
    <div class="page-header mb-4">
      <h1>User Management</h1>
    </div>

    <!-- User Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>{{ totalUsers }}</h3>
          <p>Total Users</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>{{ adminUsers }}</h3>
          <p>Admins</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>{{ activeUsers }}</h3>
          <p>Active This Month</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>{{ newUsers }}</h3>
          <p>New This Week</p>
        </div>
      </div>
    </div>

    <!-- User Table -->
    <div class="card">
      <div class="card-header d-flex justify-content-between">
        <h5 class="mb-0">All Users</h5>
        <input 
          v-model="searchQuery" 
          type="search" 
          class="form-control w-auto" 
          placeholder="Search users..."
        >
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Batch</th>
                <th>XP</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.uid">
                <td>
                  <router-link :to="`/user/${user.uid}`">
                    {{ user.displayName }}
                  </router-link>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.batch }}</td>
                <td>{{ user.totalXp || 0 }}</td>
                <td>
                  <span :class="user.isAdmin ? 'badge bg-danger' : 'badge bg-secondary'">
                    {{ user.isAdmin ? 'Admin' : 'User' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button 
                      @click="toggleAdmin(user)" 
                      class="btn btn-warning"
                    >
                      <i :class="user.isAdmin ? 'fas fa-user' : 'fas fa-user-shield'"></i>
                      {{ user.isAdmin ? 'Remove Admin' : 'Make Admin' }}
                    </button>
                    <button 
                      @click="viewProfile(user.uid)" 
                      class="btn btn-primary"
                    >
                      <i class="fas fa-eye"></i> View
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getDataAdapter } from '@/services/dataAdapter/IDataAdapter';
import type { Student } from '@/types/student';

const router = useRouter();
const users = ref<Student[]>([]);
const searchQuery = ref('');

const totalUsers = computed(() => users.value.length);
const adminUsers = computed(() => users.value.filter(u => u.isAdmin).length);
const activeUsers = computed(() => {
  // Implement logic to count active users
  return 0;
});
const newUsers = computed(() => {
  // Implement logic to count new users
  return 0;
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  
  const query = searchQuery.value.toLowerCase();
  return users.value.filter(u => 
    u.displayName?.toLowerCase().includes(query) ||
    u.email?.toLowerCase().includes(query)
  );
});

async function loadUsers() {
  const adapter = await getDataAdapter();
  users.value = await adapter.getStudents();
}

async function toggleAdmin(user: Student) {
  const action = user.isAdmin ? 'remove admin rights from' : 'grant admin rights to';
  if (!confirm(`Are you sure you want to ${action} ${user.displayName}?`)) return;
  
  try {
    const adapter = await getDataAdapter();
    await adapter.updateStudent(user.uid, { isAdmin: !user.isAdmin });
    await loadUsers();
  } catch (error) {
    console.error('Failed to toggle admin status:', error);
  }
}

function viewProfile(uid: string) {
  router.push(`/user/${uid}`);
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.stat-card {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
  
  h3 {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #0d6efd;
  }
  
  p {
    margin: 0;
    color: #6c757d;
  }
}
</style>
```

## Analytics Dashboard

Create `src/views/admin/DashboardView.vue`:

```vue
<template>
  <div class="admin-dashboard">
    <h1 class="mb-4">Dashboard</h1>

    <!-- Quick Stats -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card bg-primary text-white">
          <i class="fas fa-calendar fa-2x mb-2"></i>
          <h3>{{ stats.totalEvents }}</h3>
          <p>Total Events</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-success text-white">
          <i class="fas fa-users fa-2x mb-2"></i>
          <h3>{{ stats.totalUsers }}</h3>
          <p>Total Users</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-warning text-white">
          <i class="fas fa-clock fa-2x mb-2"></i>
          <h3>{{ stats.pendingEvents }}</h3>
          <p>Pending Approval</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card bg-info text-white">
          <i class="fas fa-chart-line fa-2x mb-2"></i>
          <h3>{{ stats.activeUsers }}</h3>
          <p>Active This Month</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Recent Events</h5>
          </div>
          <div class="card-body">
            <div v-for="event in recentEvents" :key="event.id" class="activity-item">
              <strong>{{ event.details.eventName }}</strong>
              <span class="text-muted">{{ formatDate(event.details.date.start) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>New Users</h5>
          </div>
          <div class="card-body">
            <div v-for="user in recentUsers" :key="user.uid" class="activity-item">
              <strong>{{ user.displayName }}</strong>
              <span class="text-muted">{{ user.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getDataAdapter } from '@/services/dataAdapter/IDataAdapter';

const stats = ref({
  totalEvents: 0,
  totalUsers: 0,
  pendingEvents: 0,
  activeUsers: 0
});

const recentEvents = ref([]);
const recentUsers = ref([]);

async function loadDashboardData() {
  const adapter = await getDataAdapter();
  const events = await adapter.getEvents();
  const users = await adapter.getStudents();
  
  stats.value = {
    totalEvents: events.length,
    totalUsers: users.length,
    pendingEvents: events.filter(e => e.status === 'Pending').length,
    activeUsers: users.length // Implement proper logic
  };
  
  recentEvents.value = events.slice(0, 5);
  recentUsers.value = users.slice(0, 5);
}

function formatDate(date: any) {
  return new Date(date).toLocaleDateString();
}

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped lang="scss">
.stat-card {
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  
  h3 {
    font-size: 2.5rem;
    margin: 0.5rem 0;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
  }
}

.activity-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
}
</style>
```

## Permissions System

The platform includes a simple permissions system. Here's how to extend it:

### Check Admin Status

```typescript
import { useProfileStore } from '@/stores/profileStore';

const profileStore = useProfileStore();

if (profileStore.isAdmin) {
  // User is an admin
}
```

### Route Protection

In `src/router/index.ts`:

```typescript
router.beforeEach((to, from, next) => {
  const profileStore = useProfileStore();
  
  // Check if route requires admin
  if (to.meta.requiresAdmin) {
    if (!profileStore.isAdmin) {
      next('/home');
      return;
    }
  }
  
  next();
});
```

### Component-Level Protection

```vue
<template>
  <div>
    <button v-if="isAdmin" @click="dangerousAction">
      Admin Only Action
    </button>
  </div>
</template>

<script setup>
import { useProfileStore } from '@/stores/profileStore';

const profileStore = useProfileStore();
const isAdmin = computed(() => profileStore.isAdmin);
</script>
```

## Best Practices

1. **Always Validate** - Check permissions on both client and server
2. **Audit Logs** - Log all admin actions
3. **Confirmation Dialogs** - Require confirmation for destructive actions
4. **Error Handling** - Handle errors gracefully
5. **Loading States** - Show loading indicators for async operations
6. **Responsive Design** - Make admin panel mobile-friendly
7. **Accessibility** - Follow WCAG guidelines

## Next Steps

- Implement [Event Lifecycle](./event-lifecycle.md) features
- Add custom analytics
- Build notification system
- Create batch operations
- Add export functionality

## Complete Example

For a complete admin panel example, see the existing admin views in the codebase:
- `src/views/AwardPointsView.vue` - XP management
- `src/views/SelectionView.vue` - Winner selection
- `src/views/ManageMultiEventView.vue` - Multi-event management
