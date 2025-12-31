<template>
  <div class="award-points-view container mt-4">
    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="event" class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <h2 class="h4 mb-0">Award Points for {{ event.details.eventName }}</h2>
      </div>
      <div class="card-body">
        <p class="text-muted">{{ event.details.description }}</p>
        <hr />
        <div v-if="participants.length > 0">
          <h3 class="h5 mb-3">Participants</h3>
          <form @submit.prevent="submitAwards">
            <div
              v-for="participant in participants"
              :key="participant.uid"
              class="participant-row d-flex align-items-center mb-3 p-2 border rounded"
            >
              <div class="flex-grow-1">
                <strong>{{ participant.name }}</strong>
                <small class="text-muted d-block">{{ participant.email }}</small>
              </div>
              <div class="ms-3" v-for="(criterion, index) in event.criteria" :key="index">
                <label :for="`points-${participant.uid}-${index}`" class="form-label">{{ criterion.title }}</label>
                <input
                  type="number"
                  class="form-control"
                  :id="`points-${participant.uid}-${index}`"
                  v-model.number="awards[participant.uid]![index]"
                  min="0"
                  :max="criterion.points"
                />
              </div>
            </div>
            <button
              type="submit"
              class="btn btn-success mt-3"
              :disabled="isSubmitting"
            >
              <span
                v-if="isSubmitting"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isSubmitting ? 'Submitting...' : 'Award Points and Close Event' }}
            </button>
          </form>
        </div>
        <div v-else>
          <p class="text-muted">No participants to award points to.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '@/stores/eventStore';
import { useProfileStore } from '@/stores/profileStore';
import type { Event } from '@/types/event';
import type { EnrichedStudentData } from '@/types/student';

export default defineComponent({
  name: 'AwardPointsView',
  setup() {
    const route = useRoute();
    const eventStore = useEventStore();
    const profileStore = useProfileStore();

    const event = ref<Event | null>(null);
    const participants = ref<EnrichedStudentData[]>([]);
    const awards = ref<Record<string, Record<string, number>>>({});
    const isLoading = ref(false);
    const isSubmitting = ref(false);
    const error = ref<string | null>(null);

    const eventId = computed(() => route.params.id as string);

    onMounted(async () => {
      isLoading.value = true;
      try {
        await eventStore.fetchEventDetails(eventId.value);
        event.value = eventStore.currentEventDetails;

        if (event.value?.participants) {
          const participantIds = event.value.participants;
          const participantProfiles = await Promise.all(
            participantIds.map(id => profileStore.fetchProfileForView(id))
          );
          participants.value = participantProfiles.filter(p => p) as EnrichedStudentData[];

          // Initialize awards object
          if (event.value.criteria) {
            participants.value.forEach(p => {
              const userAwards: Record<string, number> = {};
              if (event.value?.criteria) {
                event.value.criteria.forEach((_, index) => {
                  userAwards[index] = 0;
                });
              }
              awards.value[p.uid] = userAwards;
            });
          }
        }
      } catch (e) {
        error.value = 'Failed to load event details.';
        console.error(e);
      } finally {
        isLoading.value = false;
      }
    });

    const submitAwards = async () => {
      if (!event.value) return;
      isSubmitting.value = true;
      try {
        await eventStore.closeEvent({ eventId: eventId.value });
        // Redirect to the event details page or a success page
        // after successful submission.
      } catch (e) {
        error.value = 'Failed to submit awards.';
        console.error(e);
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      event,
      participants,
      awards,
      isLoading,
      isSubmitting,
      error,
      submitAwards,
    };
  },
});
</script>

<style scoped>
.award-points-view {
  max-width: 800px;
}
</style>
