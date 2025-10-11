// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

interface RouteMeta {
  requiresAuth?: boolean;
  guestOnly?: boolean;
  roles?: string[];
  publicAccess?: boolean;
  title?: string;
  description?: string;
  [key: string]: any;
  [key: symbol]: any;
}

const routes: Array<RouteRecordRaw> = [
    { path: '/', name: 'Landing', component: () => import('@/views/LandingView.vue'), meta: { requiresAuth: false, guestOnly: true, title: 'Welcome to the Tech Community', description: 'Discover the Tech Community: a hub for developers to manage events, collaborate on software projects, and access shared resources. Join us to learn, build, and grow.' } as RouteMeta },
    { path: '/home', name: 'Home', component: () => import('@/views/HomeView.vue'), meta: { requiresAuth: true, title: 'Home Dashboard', description: 'Your personalized dashboard in the Tech Community.' } as RouteMeta },
    { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { requiresAuth: false, guestOnly: true, title: 'Login', description: 'Login to your Tech Community account.' } as RouteMeta },
    { path: '/event/:id', name: 'EventDetails', component: () => import('@/views/EventDetailsView.vue'), meta: { requiresAuth: true, title: 'Event Details', description: 'View details for a specific event.' }, props: true },
    { path: '/event/:id/award', name: 'AwardPoints', component: () => import('@/views/AwardPointsView.vue'), meta: { requiresAuth: true, roles: ['Student'], title: 'Award Points', description: 'Award points to participants of an event.' } as RouteMeta, props: true },
    { path: '/leaderboard', name: 'Leaderboard', component: () => import('@/views/LeaderboardView.vue'), meta: { requiresAuth: false, title: 'Leaderboard', description: 'Check out the Tech Community leaderboard.' } as RouteMeta },
    { path: '/resources', name: 'Resources', component: () => import('@/views/ResourcesView.vue'), meta: { requiresAuth: false, title: 'Resources', description: 'Access learning resources and materials from the Tech Community.' } as RouteMeta },
    { path: '/transparency', name: 'Transparency', component: () => import('@/views/TransparencyView.vue'), meta: { requiresAuth: false, publicAccess: true, title: 'Transparency', description: 'View the Tech Community\'s transparency reports and data.' } as RouteMeta },
    { path: '/request-event', name: 'RequestEvent', meta: { requiresAuth: true, roles: ['Student'], title: 'Request Individual/Team Event', description: 'Request a new Individual or Team event.' } as RouteMeta, component: () => import('@/views/RequestEventView.vue'), },
    { path: '/edit-event/:eventId', name: 'EditEvent', meta: { requiresAuth: true, roles: ['Student'], title: 'Edit Individual/Team Event', description: 'Edit an existing Individual or Team event request.' } as RouteMeta, component: () => import('@/views/RequestEventView.vue'), props: true },

    // Routes for Multi-Stage Events
    { path: '/create-multi-event', name: 'CreateMultiEvent', component: () => import('@/views/ManageMultiEventView.vue'), meta: { requiresAuth: true, roles: ['Student'], title: 'Create Multi-Stage Event', description: 'Create a new multi-stage event with multiple phases.' } as RouteMeta },
    { path: '/edit-multi-event/:eventId', name: 'EditMultiEvent', component: () => import('@/views/ManageMultiEventView.vue'), meta: { requiresAuth: true, roles: ['Student'], title: 'Edit Multi-Stage Event', description: 'Edit an existing multi-stage event.' } as RouteMeta, props: true },
    { path: '/edit-multi-event/pending/:eventId', name: 'EditPendingMultiEvent', component: () => import('@/views/ManageMultiEventView.vue'), meta: { requiresAuth: true, roles: ['Student'], title: 'Edit Pending Multi-Stage Event', description: 'Edit an existing multi-stage event that is pending approval.' } as RouteMeta, props: true },

    { path: '/profile', name: 'Profile', component: () => import('@/views/ProfileView.vue'), meta: { requiresAuth: true, title: 'My Profile', description: 'View and manage your Tech Community profile.' } as RouteMeta },
    { path: '/profile/edit', name: 'EditProfile', component: () => import('@/views/EditProfileView.vue'), meta: { requiresAuth: true, title: 'Edit Profile', description: 'Edit your Tech Community profile information.' } as RouteMeta, props: true },
    { path: '/user/:userId', name: 'PublicProfile', component: () => import('@/views/ProfileView.vue'), props: true, meta: { requiresAuth: false, title: 'User Profile', description: 'View a Tech Community member\'s public profile.' } as RouteMeta },
    { path: '/forgot-password', name: 'ForgotPassword', component: () => import('@/views/ForgotPasswordView.vue'), meta: { requiresAuth: false, guestOnly: true, title: 'Forgot Password', description: 'Reset your Tech Community account password.' } as RouteMeta },
    { path: '/signup', name: 'StudentSignup', component: () => import('@/views/SignupView.vue'), meta: { requiresAuth: false, publicAccess: true, title: 'Student Registration', description: 'Register for the Tech Community with your batch signup link.' } as RouteMeta },
    { path: '/events', name: 'EventsList', component: () => import('@/views/EventsListView.vue'), meta: { requiresAuth: false, title: 'Events', description: 'Browse upcoming and past events by the Tech Community.' } as RouteMeta },
    { path: '/selection/:eventId/:teamId?', name: 'SelectionForm', component: () => import('@/views/SelectionView.vue'), meta: { requiresAuth: true, title: 'Team Selection', description: 'Participate in team selection for an event.' } as RouteMeta, props: true },
    { path: '/legal', name: 'Legal', component: () => import('@/views/LegalView.vue'), meta: { requiresAuth: false, title: 'Terms & Privacy', description: 'Read the Terms of Service and Privacy Policy for the Tech Community.' } as RouteMeta },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue'), meta: { requiresAuth: false, title: 'Page Not Found', description: 'The page you are looking for does not exist.' } as RouteMeta },
] as RouteRecordRaw[];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) { return savedPosition; }
    return { top: 0 };
  }
});

const DEFAULT_TITLE = 'Tech Community';
const DEFAULT_DESCRIPTION = 'A Software Community Platform for Events & Learning. Join us for skill development, networking, and tech discussions.';
const SITE_URL = 'https://www.example.com';

router.afterEach((to) => {
  const routeMeta = to.meta as RouteMeta;
  const title = routeMeta.title ? `${routeMeta.title} | Tech Community` : DEFAULT_TITLE;
  const description = routeMeta.description || DEFAULT_DESCRIPTION;
  const fullUrl = SITE_URL + to.fullPath;

  document.title = title;

  const setMetaTag = (attrs: { [key: string]: string }) => {
    let element = document.querySelector(
      attrs.name ? `meta[name="${attrs.name}"]` : `meta[property="${attrs.property}"]`
    );
    if (!element) {
      element = document.createElement('meta');
      document.head.appendChild(element);
    }
    Object.keys(attrs).forEach(attr => {
      const value = attrs[attr];
      if (value) {
        (element as HTMLMetaElement).setAttribute(attr, value);
      }
    });
  };
  
  const setLinkTag = (attrs: { [key: string]: string }) => {
    let element = document.querySelector(`link[rel="${attrs.rel}"]`);
    if (!element) {
      element = document.createElement('link');
      document.head.appendChild(element);
    }
     Object.keys(attrs).forEach(attr => {
      const value = attrs[attr];
      if (value) {
        (element as HTMLLinkElement).setAttribute(attr, value);
      }
    });
  };

  setMetaTag({ name: 'description', content: description });

  // Open Graph
  setMetaTag({ property: 'og:title', content: title });
  setMetaTag({ property: 'og:description', content: description });
  setMetaTag({ property: 'og:url', content: fullUrl });
  setMetaTag({ property: 'og:image', content: SITE_URL + '/logo.png' });
  setMetaTag({ property: 'og:type', content: 'website' });
  setMetaTag({ property: 'og:site_name', content: 'Tech Community' });

  // Canonical URL
  setLinkTag({ rel: 'canonical', href: fullUrl });
});

export default router;