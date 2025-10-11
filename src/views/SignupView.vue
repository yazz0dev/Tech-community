<template>
  <div class="signup-bg d-flex align-items-center justify-content-center overflow-hidden">
    <div class="container container-sm">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <transition name="fade-pop">
            <div class="card signup-card shadow-lg border-0 animate-pop">
              <div class="card-body p-4 p-md-5">
                <!-- Back Button - Integrated into card header -->
                <div class="d-flex align-items-center justify-content-between mb-4">
                  <button
                    class="btn btn-back btn-sm btn-icon"
                    @click="goBack"
                    aria-label="Back to Login"
                  >
                    <i class="fas fa-arrow-left me-1"></i>
                    <span>Back to Login</span>
                  </button>
                </div>

                <div class="text-center mb-4">
                  <div class="signup-icon mb-2">
                    <i class="fas fa-user-plus fa-3x text-primary"></i>
                  </div>
                  <h2 class="h3 fw-bold gradient-text mb-1">Student Registration</h2>
                  <p class="text-subtitle mb-0">
                    Join Tech Community - Batch {{ batchYear || 'Unknown' }}
                  </p>
                </div>

                <!-- Success Message -->
                <div v-if="submissionSuccess" class="alert alert-success text-center" role="alert">
                  <i class="fas fa-check-circle me-2"></i>
                  <strong>Registration Submitted!</strong>
                  <p class="mb-0 mt-2 small">
                    Your registration has been submitted for approval. You will be notified via email once your account is activated.
                  </p>
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="alert alert-danger small p-2 text-center" role="alert">
                  {{ errorMessage }}
                </div>

                <!-- Invalid Link Message -->
                <div v-if="invalidLink" class="alert alert-warning text-center" role="alert">
                  <i class="fas fa-exclamation-triangle me-2"></i>
                  <strong>Invalid Registration Link</strong>
                  <p class="mb-0 mt-2 small">
                    This registration link is invalid or has expired. Please contact your admin for a new link.
                  </p>
                </div>

                <!-- Registration Form -->
                <form v-if="!submissionSuccess && !invalidLink" @submit.prevent="submitRegistration" autocomplete="on">
                  <div class="mb-3">
                    <label for="fullName" class="form-label">Full Name <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-user"></i></span>
                      <input
                        id="fullName"
                        class="form-control"
                        type="text"
                        v-model="formData.fullName"
                        placeholder="Enter your full name"
                        required
                        :disabled="isLoading"
                        autocomplete="name"
                      />
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="email" class="form-label">Email Address <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                      <input
                        id="email"
                        class="form-control"
                        type="email"
                        v-model="formData.email"
                        placeholder="you@example.com"
                        required
                        :disabled="isLoading"
                        autocomplete="email"
                      />
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="studentId" class="form-label">Student ID <span class="text-danger">*</span></label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-id-card"></i></span>
                      <input
                        id="studentId"
                        class="form-control"
                        type="text"
                        v-model="formData.studentId"
                        placeholder="Enter your student ID"
                        required
                        :disabled="isLoading"
                        autocomplete="off"
                        @blur="validateField('studentId')"
                      />
                    </div>
                    <div v-if="validationErrors.studentId" class="invalid-feedback">{{ validationErrors.studentId }}</div>
                  </div>

                  <div class="mb-3">
                    <label for="hasLaptop" class="form-label">Do you have a laptop? <span class="text-danger">*</span></label>
                    <div class="form-check">
                      <input
                        id="hasLaptopYes"
                        class="form-check-input"
                        type="radio"
                        name="hasLaptop"
                        :value="true"
                        v-model="formData.hasLaptop"
                        required
                        :disabled="isLoading"
                      />
                      <label class="form-check-label" for="hasLaptopYes">
                        Yes, I have a laptop
                      </label>
                    </div>
                    <div class="form-check">
                      <input
                        id="hasLaptopNo"
                        class="form-check-input"
                        type="radio"
                        name="hasLaptop"
                        :value="false"
                        v-model="formData.hasLaptop"
                        required
                        :disabled="isLoading"
                      />
                      <label class="form-check-label" for="hasLaptopNo">
                        No, I don't have a laptop
                      </label>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="skills" class="form-label">Skills (Optional)</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="fas fa-code"></i></span>
                      <input
                        id="skills"
                        class="form-control"
                        type="text"
                        v-model="skillsInput"
                        placeholder="e.g., JavaScript, Python, React (comma-separated)"
                        :disabled="isLoading"
                      />
                    </div>
                    <div class="form-text small">
                      Enter your technical skills separated by commas
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="bio" class="form-label">Bio (Optional)</label>
                    <textarea
                      id="bio"
                      class="form-control"
                      v-model="formData.bio"
                      placeholder="Tell us a bit about yourself..."
                      rows="3"
                      :disabled="isLoading"
                      maxlength="500"
                    ></textarea>
                    <div class="form-text small">
                      {{ formData.bio?.length || 0 }}/500 characters
                    </div>
                  </div>

                  <div class="mb-4">
                    <div class="form-check">
                      <input
                        id="agreeTerms"
                        class="form-check-input"
                        type="checkbox"
                        v-model="formData.agreeTerms"
                        required
                        :disabled="isLoading"
                      />
                      <label class="form-check-label" for="agreeTerms">
                        I agree to the 
                        <router-link to="/legal" target="_blank" class="text-primary">
                          Terms of Service and Privacy Policy
                        </router-link>
                        <span class="text-danger">*</span>
                      </label>
                    </div>
                  </div>

                  <div class="mt-4">
                    <button
                      type="submit"
                      class="btn btn-primary btn-lg w-100"
                      :class="{ 'btn-loading': isLoading }"
                      :disabled="isLoading || !isFormValid"
                    >
                      <span class="btn-text">{{ isLoading ? 'Submitting...' : 'Submit Registration' }}</span>
                    </button>
                  </div>
                </form>

                <!-- Back to Landing -->
                <div v-if="submissionSuccess || invalidLink" class="mt-4 text-center">
                  <router-link
                    to="/"
                    class="btn btn-outline-primary btn-icon"
                  >
                    <i class="fas fa-home me-1"></i>
                    Back to Home
                  </router-link>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import type { RegistrationFormData, signup } from '@/types/signup';
import { validateSignupToken, isValidBatchYear, isBatchSignupActive } from '@/utils/signupUtils';

const route = useRoute();

// Form data
const formData = reactive<RegistrationFormData>({
  fullName: '',
  email: '',
  studentId: '',
  hasLaptop: null,
  bio: '',
  agreeTerms: false,
});

const skillsInput = ref('');
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);
const submissionSuccess = ref(false);
const invalidLink = ref(false);
const batchYear = ref<number | null>(null);
const signupToken = ref<string | null>(null);

const validationErrors = reactive<Partial<Record<keyof RegistrationFormData, string>>>({});

// Computed properties
const isFormValid = computed(() => {
  return (
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.studentId.trim() &&
    formData.hasLaptop !== null &&
    formData.agreeTerms
  );
});

// Validate signup link
const validateSignupLink = async (): Promise<boolean> => {
  const batch = route.query.batch;
  const token = route.query.token;

  if (batch) {
    const year = parseInt(batch as string);
    if (!isNaN(year) && isValidBatchYear(year)) {
      // Check if batch signup is active
      const isActive = await isBatchSignupActive(year);
      if (!isActive) {
        errorMessage.value = `Signup for batch ${year} is currently not active. Please contact your administrator.`;
        return false;
      }
      batchYear.value = year;
      return true;
    }
  }

  if (token && typeof token === 'string') {
    signupToken.value = token;
    try {
      const validation = await validateSignupToken(token);
      if (validation.isValid && validation.batchYear) {
        // Check if batch signup is active for token-based links too
        const isActive = await isBatchSignupActive(validation.batchYear);
        if (!isActive) {
          errorMessage.value = `Signup for batch ${validation.batchYear} is currently not active. Please contact your administrator.`;
          return false;
        }
        batchYear.value = validation.batchYear;
        return true;
      } else {
        errorMessage.value = validation.error || 'Invalid signup token';
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      errorMessage.value = 'Error validating signup link';
      return false;
    }
  }

  return false;
};

// Check if email or student ID already exists
const checkExistingRegistration = async (email: string, studentId: string): Promise<boolean> => {
  console.log(`Checking for existing registration for email: ${email} and studentId: ${studentId}`);
  return true;
};

// Submit registration
const submitRegistration = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    // Validate form
    if (!isFormValid.value) {
      errorMessage.value = 'Please fill in all required fields correctly.';
      return;
    }

    // Check for existing registration
    const canProceed = await checkExistingRegistration(
      formData.email.trim(),
      formData.studentId.trim()
    );

    if (!canProceed) {
      return;
    }

    // Parse skills
    const skills = skillsInput.value
      ? skillsInput.value.split(',').map(skill => skill.trim()).filter(skill => skill)
      : [];

    // Prepare registration data
    const registrationData: Omit<signup, 'id'> = {
      fullName: formData.fullName.trim(),
      email: formData.email.toLowerCase().trim(),
      studentId: formData.studentId.toUpperCase().trim(),
      batchYear: batchYear.value!,
      hasLaptop: formData.hasLaptop!,
      bio: formData.bio?.trim() || '',
      skills: skills,
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
      signupSource: {
        batch: batchYear.value,
        token: signupToken.value,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null
      }
    };

    console.log("Submitting registration data:", registrationData);
    submissionSuccess.value = true;
    
  } catch (error) {
    console.error('Error submitting registration:', error);
    errorMessage.value = 'Failed to submit registration. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  const isValid = await validateSignupLink();
  if (!isValid) {
    invalidLink.value = true;
  }
});

// Go back function
function goBack() {
  window.location.href = '/login';
}

const validateField = (field: keyof RegistrationFormData) => {
  switch (field) {
    case 'email':
      if (!formData.email) validationErrors.email = 'Email is required.';
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) validationErrors.email = 'Email is invalid.';
      break;
    case 'studentId':
      if (!formData.studentId) validationErrors.studentId = 'Student ID is required.';
      else if (!/^\d{5}$/.test(formData.studentId)) validationErrors.studentId = 'Student ID must be 5 digits.';
      break;
    case 'hasLaptop':
      if (formData.hasLaptop === null) validationErrors.hasLaptop = 'Please select an option.';
      break;
    default:
      break;
  }
};
</script>

<style scoped>
.signup-bg {
  min-height: 100vh;
  width: 100vw;
  position: relative;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, var(--bs-light) 0%, var(--bs-primary-bg-subtle) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 2rem 0;
}

.signup-card {
  border-radius: var(--bs-border-radius-xl);
  background: var(--bs-card-bg);
  box-shadow: var(--bs-box-shadow-lg);
  width: 100%;
}

.signup-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bs-light);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  margin: 0 auto 0.5rem auto;
  box-shadow: var(--bs-box-shadow-sm);
}

.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: all 0.3s ease-out;
}

.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* Local @keyframes popIn removed. */

.form-check-input:checked {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}

.input-group-text {
  background-color: transparent;
}

.form-control:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

@media (max-width: 576px) {
  .signup-card {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .card-body {
    padding: 1.5rem !important;
  }
}
</style>