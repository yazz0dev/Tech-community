<template>
  <div
    class="letter-avatar"
    :style="avatarStyle"
    role="img"
    :aria-label="ariaLabel"
  >
    <img
      v-if="displayPhotoUrl && !imageError"
      :src="displayPhotoUrl"
      alt="Profile Avatar"
      class="avatar-image"
      :style="{ width: size + 'px', height: size + 'px' }"
      @error="handleImageError"
      @load="handleImageLoad"
      loading="lazy"
    />
    <span
      v-else-if="username"
      class="avatar-initials"
      :style="initialsStyle"
      aria-hidden="true"
    >
      {{ getInitials(username) }}
    </span>
    <span
      v-else
      class="avatar-initials"
      :style="initialsStyle"
      aria-hidden="true"
    >
      ?
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 60, // Default size in pixels
  },
  defaultAvatarSrc: { // Fallback if everything else fails (e.g. network error for photoUrl)
    type: String,
    default: '/default-avatar.png', // Ensure this path is correct
  }
});

const imageError = ref(false);
const imageLoadedSuccessfully = ref(false);

// Use a reactive property for the photo URL to be displayed
const displayPhotoUrl = ref(props.photoUrl);

watch(() => props.photoUrl, (newUrl) => {
  displayPhotoUrl.value = newUrl;
  imageError.value = false; // Reset error state when photoUrl changes
  imageLoadedSuccessfully.value = false;
});

const handleImageError = () => {
  if (displayPhotoUrl.value === props.defaultAvatarSrc) {
    // If even the default avatar fails, stop trying to prevent infinite loop
    console.error('Failed to load the default avatar image itself.');
  } else if (displayPhotoUrl.value) {
    // Try falling back to defaultAvatarSrc if the provided photoUrl fails
    // console.warn(`Image error for ${displayPhotoUrl.value}, falling back to default.`);
    displayPhotoUrl.value = props.defaultAvatarSrc; // This will trigger another load attempt by the img tag for the default
  }
  imageError.value = true; // Mark that an error occurred with the original or current displayPhotoUrl
  imageLoadedSuccessfully.value = false;
};

const handleImageLoad = () => {
  imageError.value = false;
  imageLoadedSuccessfully.value = true;
};

const initialsBackgroundColor = computed(() => {
  if (!props.username) return '#CCCCCC'; // Default grey if no username

  let hash = 0;
  for (let i = 0; i < props.username.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = props.username.charCodeAt(i) + ((hash << 5) - hash);
    // eslint-disable-next-line no-bitwise
    hash &= hash; // Convert to 32bit integer
  }

  // More vibrant and distinct color palette
  const colors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f39c12', '#d35400', '#c0392b', '#bdc3c7', '#7f8c8d'
  ];
  // eslint-disable-next-line no-bitwise
  const index = Math.abs(hash % colors.length);
  return colors[index] || '#CCCCCC';
});

const getInitials = (name: string): string => {
  if (!name) return '?';
  const nameParts = name.trim().split(/\s+/);
  const firstPart = nameParts[0];
  if (nameParts.length === 1 && firstPart && firstPart.length > 0) {
    return firstPart[0]?.toUpperCase() ?? '?';
  }
  if (nameParts.length > 1) {
    const lastPart = nameParts[nameParts.length - 1];
    const firstInitial = firstPart?.[0];
    const lastInitial = lastPart?.[0];
    if (firstInitial && lastInitial) {
      return (firstInitial + lastInitial).toUpperCase();
    }
    if (firstInitial) return firstInitial.toUpperCase();
  }
  return name[0]?.toUpperCase() ?? '?';
};

const avatarStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  borderRadius: '50%',
  backgroundColor: (displayPhotoUrl.value && imageLoadedSuccessfully.value && !imageError.value) ? 'transparent' : initialsBackgroundColor.value,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  fontSize: Math.max(12, props.size * 0.4) + 'px', // Dynamic font size
  color: '#ffffff', // White text for initials
  fontWeight: 'bold',
  userSelect: 'none' as const,
  border: '2px solid rgba(0,0,0,0.05)', // Subtle border
}));

const initialsStyle = computed(() => ({
  fontSize: Math.max(12, props.size * (getInitials(props.username || '').length > 1 ? 0.35 : 0.45)) + 'px', // Adjust for 1 or 2 initials
  lineHeight: props.size + 'px', // Center text vertically
  textAlign: 'center' as const,
  color: '#ffffff',
}));

const ariaLabel = computed(() => {
  return props.username ? `Profile avatar for ${props.username}` : 'Profile avatar';
});

</script>

<style scoped>
.letter-avatar {
  display: inline-flex; /* Changed from inline-block to inline-flex */
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-transform: uppercase;
  font-family: 'Arial', sans-serif; /* Generic sans-serif font */
  transition: background-color 0.3s ease-in-out;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%; /* Ensure image itself is also rounded if not already */
}

.avatar-initials {
  display: block; /* Ensure span takes up space for centering */
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
