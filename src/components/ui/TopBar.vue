<template>
  <nav ref="navbarRef" class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-2 px-3 fixed-top">
    <div class="container-fluid">
      <router-link class="navbar-brand fw-bold text-primary" :to="brandLinkTarget">
        <span>{{ communityConfig.shortName || communityConfig.name }}</span>
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav" ref="navbarCollapseRef">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item" v-if="isAuthenticated">
            <router-link class="nav-link" :to="{ name: 'Home' }" @click="closeNavbar">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link
              class="nav-link"
              active-class="active fw-semibold"
              to="/events"
              @click="closeNavbar"
            >
              Events
            </router-link>
          </li>
           <li class="nav-item d-none d-lg-block">
             <router-link
                class="nav-link"
                active-class="active fw-semibold"
                to="/leaderboard"
                @click="closeNavbar"
             >
                Leaderboard
             </router-link>
           </li>
          <li class="nav-item">
            <router-link
              class="nav-link"
              active-class="active fw-semibold"
              to="/resources"
              @click="closeNavbar"
            >
              Resources
            </router-link>
          </li>
          <li class="nav-item">
            <router-link
              class="nav-link"
              active-class="active fw-semibold"
              to="/transparency"
              @click="closeNavbar"
            >
              Transparency
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto align-items-lg-center">
          <template v-if="!isAuthenticated && !isLandingOrLoginPage">
            <li class="nav-item">
              <router-link
                class="btn btn-primary btn-sm"
                to="/login"
                @click="closeNavbar"
              >
                 <i class="fas fa-sign-in-alt me-1"></i> Login
              </router-link>
            </li>
          </template>

          <template v-if="isAuthenticated">
            <li class="nav-item dropdown">
              <a ref="userDropdownRef" class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarUserDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-user-circle me-1"></i>
                <span>{{ userName }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarUserDropdown">
                <li>
                  <router-link
                    class="dropdown-item"
                    to="/profile"
                    @click="closeNavbar"
                  >
                    <i class="fas fa-user fa-fw me-2"></i> View Profile
                  </router-link>
                </li>
                <li>
                  <button
                    class="dropdown-item"
                    @click="handleLogout"
                  >
                    <i class="fas fa-sign-out-alt fa-fw me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Collapse } from 'bootstrap';
import { communityConfig } from '@/config/community.config';

const props = defineProps<{
  isAuthenticated: boolean;
  userName: string;
}>();

const emit = defineEmits<{
  (e: 'logout'): void;
}>();

const router = useRouter();
const route = useRoute();

// Template refs
const navbarRef = ref<HTMLElement | null>(null);
const navbarCollapseRef = ref<HTMLElement | null>(null);
const userDropdownRef = ref<HTMLAnchorElement | null>(null);

// Bootstrap instances
let collapseInstance: Collapse | null = null;

// Check if current route is Landing or Login page
const isLandingOrLoginPage = computed(() => {
  return route.name === 'Landing' || route.path === '/login' || route.name === 'Login';
});

// Compute brand link target based on auth state
const brandLinkTarget = computed(() => {
  return props.isAuthenticated ? { name: 'Home' } : { name: 'Landing' };
});

const closeNavbar = () => {
  // Check if the collapse instance exists and the element is currently shown
  if (collapseInstance && navbarCollapseRef.value?.classList.contains('show')) {
    collapseInstance.hide();
  }
};

const handleLogout = () => {
  closeNavbar();
  emit('logout');
};

onMounted(() => {
  // Initialize collapse instance from the imported module
  if (navbarCollapseRef.value) {
    collapseInstance = new Collapse(navbarCollapseRef.value, {
      toggle: false,
    });
  }

  // Initialize dropdown instance from the imported module
  if (userDropdownRef.value) {
  }

  // --- Event Listeners for reliably closing the mobile navbar ---

  // 1. Close on outside click. Using capture phase to catch clicks before they are stopped.
  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (navbarCollapseRef.value?.classList.contains('show')) {
      // If click is outside the entire navbar component, close it.
      if (!navbarRef.value?.contains(target)) {
        closeNavbar();
      }
    }
  };

  // 2. Close on 'Escape' key press
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && navbarCollapseRef.value?.classList.contains('show')) {
      closeNavbar();
    }
  };

  // 3. Close on route change
  const removeAfterEach = router.afterEach(() => {
    closeNavbar();
  });

  // Add event listeners
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('keydown', handleEscapeKey, true);

  onUnmounted(() => {
    // Clean up event listeners to prevent memory leaks
    document.removeEventListener('click', handleDocumentClick, true);
    document.removeEventListener('keydown', handleEscapeKey, true);
    removeAfterEach();

    // It is generally not recommended to dispose bootstrap instances in Vue,
    // as it can interfere with HMR and Vue's patching algorithm.
    // Removing event listeners is the most crucial part of cleanup.
  });
});
</script>

<style scoped>
.navbar {
  /* Use CSS vars defined in main.scss for height */
  min-height: var(--navbar-height-mobile);
  border-bottom: 1px solid var(--bs-border-color);
  transition: background-color 0.3s ease-in-out;
  padding-top: 0.25rem; /* Reduced padding */
  padding-bottom: 0.25rem; /* Reduced padding */
}

@media (min-width: 992px) {
  .navbar {
    min-height: var(--navbar-height-desktop);
  }
}

@media (max-width: 991.98px) {
  /* Styles for the collapsed mobile menu container */
  #navbarNav.collapse.show,
  #navbarNav.collapsing {
    /* Use a clean, light background for consistency */
    background-color: var(--bs-white); 
    padding: 0.75rem;
    margin-top: 0.5rem;
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
    box-shadow: var(--bs-box-shadow-lg);
  }

  #navbarNav .nav-item {
    margin-bottom: 0.25rem;
  }

  #navbarNav .nav-link {
    color: var(--bs-dark); /* Dark text for readability on light background */
    padding: 0.6rem 0.8rem;
    border-radius: var(--bs-border-radius-sm);
    font-weight: 500; /* Medium weight for clarity */
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  #navbarNav .nav-link:hover,
  #navbarNav .nav-link:focus {
    color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.1);
  }

  #navbarNav .nav-link.router-link-active.router-link-exact-active,
  #navbarNav .nav-link.active {
    color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    font-weight: 600; /* Bolder for active link */
  }

  /* Adjustments for the authentication button inside the mobile menu */
  .navbar-nav .btn-primary {
    width: 100%;
    margin-top: 0.5rem;
  }
  
  /* Make sure dropdown menu inside mobile nav looks good */
  #navbarNav .dropdown-menu {
    border: none;
    box-shadow: none;
    padding: 0;
    margin-top: 0.5rem;
  }
  
  #navbarNav .dropdown-item {
    color: var(--bs-dark);
  }
}

/* Ensure dropdown appears nicely on desktop too */
.dropdown-menu {
  margin-top: 0.5rem;
  border-radius: var(--bs-border-radius);
  box-shadow: var(--bs-box-shadow-lg);
  border: 1px solid var(--bs-border-color);
}
</style>
