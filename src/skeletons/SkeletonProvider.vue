<template>
  <div class="skeleton-provider">
    <component
      v-if="loading"
      :is="skeletonComponent"
      v-bind="skeletonProps"
    />
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
// Define required props
interface Props {
  loading: boolean;
  skeletonComponent: any; // Use a more specific type if available
  skeletonProps?: Record<string, any>;
}

// Define props without assigning to a variable to avoid linting warnings
defineProps<Props>();
</script>

<style scoped>
.skeleton-provider {
  position: relative;
}

.connection-status {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1090; /* Increased z-index to be above modals and toasts */
  transition: all 0.3s ease-in-out;
}

.connection-status.has-queue {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.offline-indicator {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>