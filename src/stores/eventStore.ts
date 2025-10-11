// src/stores/eventStore.ts
import { defineStore } from 'pinia';
import { ref, computed, type Ref } from 'vue';
import { type Event, type EventFormData, EventStatus } from '@/models/event';
import { useProfileStore } from './profileStore';
import { useNotificationStore } from './notificationStore';
import { useAppStore } from './appStore';
import { 
  fetchAllEvents,
  fetchMyEventRequests as fetchMyEventRequestsService,
  fetchSingleEventForStudent,
  fetchPubliclyViewableEvents,
  hasPendingRequest
} from '@/services/eventService/eventQueries';

export const useEventStore = defineStore('studentEvents', () => {
  // --- State ---
  const events = ref<Event[]>([]);
  const viewedEventDetails = ref<Event | null>(null);
  const myEventRequests = ref<Event[]>([]);
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const actionError = ref<string | null>(null);
  const fetchError = ref<string | null>(null);

  // --- Dependencies ---
  const profileStore = useProfileStore();
  const notificationStore = useNotificationStore();
  const appStore = useAppStore();

  // --- Getters (Computed) ---
  const allPubliclyViewableEvents = computed(() => events.value);
  const currentEventDetails = computed(() => viewedEventDetails.value);
  const upcomingEvents = computed(() => events.value.filter(e => new Date(e.details.date.start) > new Date()));
  const pastEvents = computed(() => events.value.filter(e => e.status === EventStatus.Closed));

  // --- Internal Helpers ---
  function _updateLocalEvent(eventData: Event) {
    const updateList = (list: Ref<Event[]>) => {
      const index = list.value.findIndex(e => e.id === eventData.id);
      if (index !== -1) {
        list.value.splice(index, 1, { ...list.value[index], ...eventData });
      } else {
        list.value.push(eventData);
      }
    };

    if ([EventStatus.Approved, EventStatus.Closed].includes(eventData.status as EventStatus)) {
      updateList(events);
    } else {
      events.value = events.value.filter(e => e.id !== eventData.id);
    }

    if (profileStore.studentId && eventData.requestedBy === profileStore.studentId && eventData.status === EventStatus.Pending) {
      updateList(myEventRequests);
    } else {
      myEventRequests.value = myEventRequests.value.filter(e => e.id !== eventData.id);
    }

    if (viewedEventDetails.value?.id === eventData.id) {
      viewedEventDetails.value = { ...viewedEventDetails.value, ...eventData };
    }
  }

  async function _handleOpError(operation: string, err: unknown): Promise<void> {
    const finalMessage = err instanceof Error ? err.message : String(err);
    actionError.value = finalMessage;
    notificationStore.showNotification({ message: finalMessage, type: 'error' });
  }

  // --- Public Actions ---

  async function fetchEvents() {
    isLoading.value = true;
    fetchError.value = null;
    try {
      events.value = await fetchAllEvents();
    } catch (err) {
      fetchError.value = "Failed to fetch events.";
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchMyEventRequests() {
    const studentId = profileStore.studentId;
    if (!studentId) { myEventRequests.value = []; return; }
    isLoading.value = true;
    fetchError.value = null;
    try {
      myEventRequests.value = await fetchMyEventRequestsService(studentId);
    } catch (err) {
      fetchError.value = "Failed to fetch your event requests.";
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchEventDetails(eventId: string): Promise<Event | null> {
    isLoading.value = true;
    fetchError.value = null;
    try {
      const eventData = await fetchSingleEventForStudent(eventId, profileStore.studentId);
      if (eventData) {
        _updateLocalEvent(eventData);
        viewedEventDetails.value = eventData;
      }
      return eventData;
    } catch (err) {
      fetchError.value = `Failed to fetch event ${eventId}.`;
      notificationStore.showNotification({ message: fetchError.value, type: 'error' });
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function requestNewEvent(formData: EventFormData): Promise<string | null> {
    const studentId = profileStore.studentId;
    if (!studentId) {
      return _handleOpError("requesting new event", new Error("User not authenticated.")).then(() => null);
    }
    isSubmitting.value = true;
    try {
      // This is a mock. In a real scenario, this would call a service to create the event.
      const newEventId = `evt_${Date.now()}`;
      const newEvent: Event = {
        id: newEventId,
        ...formData,
        status: EventStatus.Pending,
        requestedBy: studentId,
        lifecycleTimestamps: { createdAt: new Date().toISOString() },
      } as Event;
      events.value.push(newEvent);
      myEventRequests.value.push(newEvent);
      notificationStore.showNotification({ message: 'Event request submitted successfully!', type: 'success' });
      return newEventId;
    } catch (err) {
      await _handleOpError('creating new event', err);
      return null;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function editMyEventRequest(eventId: string, formData: EventFormData): Promise<boolean> {
    const studentId = profileStore.studentId;
    if (!studentId) {
      return _handleOpError("editing event request", new Error("User not authenticated.")).then(() => false);
    }
    isSubmitting.value = true;
    try {
      const eventIndex = events.value.findIndex(e => e.id === eventId);
      if (eventIndex > -1) {
        events.value[eventIndex] = { ...events.value[eventIndex], ...formData } as Event;
      }
      const myRequestIndex = myEventRequests.value.findIndex(e => e.id === eventId);
      if (myRequestIndex > -1) {
        myEventRequests.value[myRequestIndex] = { ...myEventRequests.value[myRequestIndex], ...formData } as Event;
      }
      notificationStore.showNotification({ message: 'Event request updated successfully!', type: 'success' });
      return true;
    } catch (err) {
      await _handleOpError("editing my event request", err);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  async function deleteEventRequest(eventId: string): Promise<boolean> {
    const studentId = profileStore.studentId;
    if (!studentId) {
      return _handleOpError("deleting event request", new Error("User not authenticated.")).then(() => false);
    }
    isLoading.value = true;
    try {
      myEventRequests.value = myEventRequests.value.filter(e => e.id !== eventId);
      events.value = events.value.filter(e => e.id !== eventId);
      if (viewedEventDetails.value?.id === eventId) viewedEventDetails.value = null;
      notificationStore.showNotification({ message: 'Event request deleted successfully!', type: 'success' });
      return true;
    } catch (err) {
      await _handleOpError("deleting event request", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateEventStatus(payload: { eventId: string; newStatus: EventStatus }) {
    if (!profileStore.currentStudent) return _handleOpError("updating status", new Error("User not authenticated."));
    const eventIndex = events.value.findIndex(e => e.id === payload.eventId);
    if (eventIndex > -1) {
      events.value[eventIndex].status = payload.newStatus;
      await fetchEventDetails(payload.eventId); // Refresh data
      notificationStore.showNotification({ message: `Event status updated to ${payload.newStatus}.`, type: 'success' });
    }
  }

  async function clearError() {
    actionError.value = null;
  }

  return {
    // State
    events,
    viewedEventDetails,
    myEventRequests,
    isLoading,
    isSubmitting,
    actionError,
    fetchError,

    // Getters
    allPubliclyViewableEvents,
    currentEventDetails,
    upcomingEvents,
    pastEvents,
    
    // Actions
    fetchEvents,
    fetchMyEventRequests,
    fetchEventDetails,
    requestNewEvent,
    editMyEventRequest,
    deleteEventRequest,
    updateEventStatus,
    clearError,
  };
});