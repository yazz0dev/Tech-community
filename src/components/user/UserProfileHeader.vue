<template>
  <div class="section-card shadow-sm rounded-4 animate-fade-in">
    <div class="card-body p-3 p-md-4">
      <!-- Profile Photo Section -->
      <div class="text-center mb-3">
        <div class="profile-photo-container position-relative d-inline-block">
          <LetterAvatar
            :username="user.name || 'User'"
            :photo-url="user.photoURL || ''"
            :size="100"
            class="profile-letter-avatar shadow-sm"
            :class="{'has-photo': user.photoURL}"
          />
          <!-- The photo-overlay might need adjustment or removal depending on LetterAvatar's final look -->
          <!-- <div class="photo-overlay rounded-circle"></div> -->
          
          <!-- Edit button for current user -->
          <button
            v-if="isCurrentUser"
            @click="emitEditProfile"
            class="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle edit-photo-btn"
            title="Edit Profile"
            aria-label="Edit Profile"
          >
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>

      <!-- User Name & Edit Button (moved outside the photo container) -->
      <div class="text-center mb-3">
        <h1 class="h4 fw-bold text-dark mb-2">{{ user.name || 'User Profile' }}</h1>
      </div>

      <!-- Social Links Section -->
      <div v-if="hasSocialLinks" class="social-links-section mb-3">
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <a
            v-if="user.socialLinks?.portfolio"
            :href="user.socialLinks.portfolio"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-light border flex-grow-1 flex-md-grow-0 d-inline-flex align-items-center justify-content-center social-link"
          >
            <i :class="['fab', socialLinkDetails.icon, 'me-2']" v-if="socialLinkDetails.isFontAwesomeBrand"></i>
            <i :class="['fas', socialLinkDetails.icon, 'me-2']" v-else></i>
            <span>{{ socialLinkDetails.name }}</span>
          </a>

          <a
            v-if="user.socialLinks?.instagram"
            :href="instagramUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-light border flex-grow-1 flex-md-grow-0 d-inline-flex align-items-center justify-content-center social-link"
          >
            <i class="fab fa-instagram me-2"></i><span>{{ user.socialLinks.instagram }}</span>
          </a>

          <a
            v-if="user.socialLinks?.portfolio"
            :href="user.socialLinks.portfolio"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-light border flex-grow-1 flex-md-grow-0 d-inline-flex align-items-center justify-content-center social-link"
          >
            <i class="fas fa-briefcase me-2"></i><span>Portfolio</span>
          </a>
        </div>
      </div>

      <!-- Bio Section -->
      <div class="bio-section mb-3 text-center">
        <div class="bio-container d-inline-block text-start p-3 bg-light rounded-3">
          <i class="fas fa-quote-left text-secondary me-1 opacity-50"></i>
          <span v-if="user.bio" class="text-secondary small">{{ user.bio }}</span>
          <span v-else class="text-muted small fst-italic">No bio provided.</span>
        </div>
      </div>

      <!-- Skills & Equipment -->
      <div class="border-top border-bottom py-2 my-3">
        <div class="row g-2">
            <!-- Skills Section -->
            <div v-if="user.skills && user.skills.length > 0" class="col-12 col-md-6 border-end-md">
                <div class="info-section-header mb-2 text-center text-md-start">
                  <i class="fas fa-code text-primary me-2"></i>
                  <span class="fw-semibold text-dark small text-uppercase">Skills</span>
                </div>
                <div class="skills-container text-center text-md-start">
                  <span
                    v-for="skill in user.skills"
                    :key="skill"
                    class="skill-badge badge bg-primary-subtle text-primary-emphasis border-0 me-1 mb-1"
                  >
                    {{ skill }}
                  </span>
                </div>
            </div>
             <!-- Equipment Section -->
            <div :class="user.skills && user.skills.length > 0 ? 'col-12 col-md-6' : 'col-12'">
                <div class="d-flex flex-column align-items-center align-items-md-start">
                  <div class="info-section-header mb-1 text-center text-md-start"> 
                    <i class="fas fa-laptop text-primary me-2"></i>
                    <span class="fw-semibold text-dark small text-uppercase">Equipment</span>
                  </div>
                  <div class="equipment-status"> 
                    <span
                      class="equipment-badge badge border"
                      :class="user.hasLaptop ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'"
                    >
                      <i :class="['fas', user.hasLaptop ? 'fa-check-circle' : 'fa-times-circle', 'me-1']"></i>
                      {{ user.hasLaptop ? 'Has Laptop' : 'No Laptop' }}
                    </span>
                  </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="stats-section mb-3">
        <div class="stats-grid">
          <div class="stat-item text-center">
            <div class="stat-value bg-primary-subtle text-primary-emphasis rounded-3 p-3 mb-2">
              <span class="h4 fw-semibold mb-0">{{ stats.participatedCount }}</span>
            </div>
            <small class="stat-label text-muted text-uppercase fw-medium">Participated</small>
          </div>
          <div class="stat-item text-center">
            <div class="stat-value bg-primary-subtle text-primary-emphasis rounded-3 p-3 mb-2">
              <span class="h4 fw-semibold mb-0">{{ stats.organizedCount }}</span>
            </div>
            <small class="stat-label text-muted text-uppercase fw-medium">Organized</small>
          </div>
          <div class="stat-item text-center">
            <div class="stat-value bg-warning-subtle text-warning-emphasis rounded-3 p-3 mb-2">
              <span class="h4 fw-semibold mb-0">{{ user.xpData?.count_wins ?? stats.wonCount }}</span>
            </div>
            <small class="stat-label text-muted text-uppercase fw-medium">Won</small>
          </div>
        </div>
      </div>

      <!-- Total XP Section -->
      <div class="xp-section">
        <div class="xp-header d-flex align-items-center justify-content-center mb-3">
          <i class="fas fa-star text-warning me-2"></i>
          <span class="fw-semibold text-secondary">Total XP Earned</span>
        </div>
        <div class="xp-value-container text-center">
                      <span class="xp-value text-hero text-primary fw-bold">{{ user.xpData?.totalCalculatedXp ?? 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { type EnrichedUserData } from '@/types/student';
// import { getOptimizedImageUrl } from '@/services/storageService'; // Removed
import LetterAvatar from '@/components/ui/LetterAvatar.vue'; // Added

interface Props {
  user: EnrichedUserData;
  isCurrentUser: boolean;
  stats: {
    participatedCount: number;
    organizedCount: number;
    wonCount: number;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'edit-profile'): void;
}>();


const hasSocialLinks = computed(() => {
  return !!(props.user.socialLinks?.portfolio || 
           props.user.socialLinks?.instagram );
});

const socialLinkDetails = computed(() => {
  const portfolioLink = props.user.socialLinks?.portfolio;
  if (!portfolioLink) {
    return { name: 'Social Profile', icon: 'fa-link', isFontAwesomeBrand: false };
  }
  const link = portfolioLink.toLowerCase();
  if (link.includes('github.com')) return { name: 'GitHub', icon: 'fa-github', isFontAwesomeBrand: true };
  if (link.includes('linkedin.com')) return { name: 'LinkedIn', icon: 'fa-linkedin', isFontAwesomeBrand: true };
  if (link.includes('twitter.com') || link.includes('x.com')) return { name: 'Twitter/X', icon: 'fa-twitter', isFontAwesomeBrand: true };
  return { name: 'Website', icon: 'fa-link', isFontAwesomeBrand: false };
});

const instagramUrl = computed(() => {
  if (!props.user.socialLinks?.instagram) return '#';
  
  // Clean up the username (remove @ if present and any trailing/leading spaces)
  const username = props.user.socialLinks.instagram.trim().replace(/^@/, '');
  
  // Return the full Instagram URL
  return `https://instagram.com/${username}`;
});

// const handleImageError = (e: Event) => { ... }; // Removed

const emitEditProfile = () => {
  emit('edit-profile');
};

// const optimizedProfilePhotoUrl = computed(() => { ... }); // Removed

onMounted(() => {
  // The ref profileImageRef was for the old img tag, no longer directly needed for LetterAvatar's src.
  // LetterAvatar handles its own internal src and fallbacks.
  // If direct manipulation of the img inside LetterAvatar was needed, it would be more complex.
  // For now, this onMounted logic related to setting src directly can be removed.
});
</script>

<style scoped>
/* Profile Photo Styling */
.profile-photo-container {
  transition: transform 0.3s ease;
  margin-bottom: 1rem;
}

.profile-photo-container:hover {
  transform: scale(1.02);
}

/* Styles for LetterAvatar integration */
.profile-letter-avatar {
  /* LetterAvatar itself is display:flex, so it behaves like a block */
  /* It handles its own width, height, and border-radius via its size prop and internal styles */
  /* We can apply additional border styling here if needed */
  border: 3px solid var(--bs-secondary); /* Default border color */
  transition: border-color 0.3s ease;
}

.profile-letter-avatar.has-photo {
  border-color: var(--bs-primary); /* Border color if photoURL exists */
}

.profile-letter-avatar:hover {
   box-shadow: var(--bs-box-shadow-lg); /* Replicate hover shadow */
}


/* The .photo-overlay might not be needed or might need different styling */
/* For now, it's commented out in the template. If re-added, styles here: */
/*
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
}

.profile-photo-container:hover .photo-overlay {
  opacity: 1;
}

/* Edit photo button */
.edit-photo-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  transform: translate(5px, 5px);
  z-index: 2;
}

.edit-photo-btn:hover {
  transform: translate(5px, 5px) scale(1.1);
}

/* Social Links */
.social-links-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

/* Bio Section */
.bio-container {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  background: var(--bs-light);
  border-radius: var(--bs-border-radius-lg);
  border: 1px solid var(--bs-border-color-translucent);
}

/* Info Section Headers */
.info-section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Skills */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
}

.skill-badge {
  border-color: var(--bs-border-color) !important;
  transition: all 0.3s ease;
  padding: 0.4rem 0.8rem;
}

.skill-badge:hover {
  background-color: var(--bs-primary-subtle) !important;
  color: var(--bs-primary-emphasis) !important;
  border-color: var(--bs-primary) !important;
  transform: translateY(-1px);
}

/* Equipment */
.equipment-status {
  display: flex;
  justify-content: center;
}

.equipment-badge {
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: transform 0.3s ease;
}

.equipment-badge:hover {
  transform: scale(1.05);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item .stat-value {
  transition: transform 0.2s ease-in-out;
}

.stat-item:hover .stat-value {
  transform: translateY(-5px);
}

.stat-label {
  font-size: 0.65rem;
}

/* XP Section */
.xp-header {
  font-size: 0.95rem;
}

.xp-value-container {
  padding: 1rem;
  background: linear-gradient(135deg, var(--bs-primary-subtle), var(--bs-light));
  border-radius: var(--bs-border-radius-lg);
  border: 1px solid var(--bs-border-color-translucent);
  transition: all 0.3s ease;
}

.xp-value-container:hover {
  transform: translateY(-2px);
  box-shadow: var(--bs-box-shadow);
}

.xp-value {
  font-size: 2.5rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Responsive Design */
@media (max-width: 767.98px) {
  .profile-photo {
    width: 90px;
    height: 90px;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .h4 {
    font-size: 1.25rem;
  }
  
  .social-links-section .btn {
    font-size: 0.8rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  
  .stat-value {
    padding: 0.75rem !important;
  }
  
  .stat-value .h4 {
    font-size: 1.25rem !important;
  }
  
  .xp-value {
    font-size: 2rem;
  }
}

@media (max-width: 991.98px) {
  .border-end-md {
    border-right: 0 !important;
  }
}

.profile-sidebar {
  top: 7rem; /* Adjust based on your navbar height */
  bottom: 0;
  background: rgba(var(--bs-primary-rgb), 0.1);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-photo-container:hover .photo-overlay {
  opacity: 1;
}

@media (min-width: 768px) {
    .border-end-md {
        border-right: 1px solid var(--bs-border-color);
    }
}
</style>
