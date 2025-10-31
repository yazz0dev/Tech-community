<template>
  <div class="landing-section">
    <!-- Welcome Section -->
    <section class="welcome-section d-flex align-items-center justify-content-center">
      <div class="container-xl text-center px-3 px-md-4">
        <transition name="fade-slide-down">
          <div>
            <h1 class="text-hero fw-bolder text-gradient-primary mb-3 mb-md-4">
              Welcome to the <span class="brand-highlight">{{ communityConfig.name }}!</span>
            </h1>
            <p class="lead text-secondary mb-3 mb-md-4 mx-auto" style="max-width: 40rem;">
              Manage events, collaborate on projects, and share resources within the {{ communityConfig.name }}.
            </p>
            <router-link
              to="/login"
              class="btn btn-primary btn-lg btn-icon animate-pop"
            >
              <i class="fas fa-sign-in-alt"></i>
              <span>Log In to Get Started</span>
            </router-link>
          </div>
        </transition>
      </div>
    </section>

    <!-- Platform Features Section -->
    <section class="features-section section-spacing">
      <div class="container-lg px-3 px-md-4">
        <transition-group name="fade-slide-up" tag="div" class="row g-2 g-md-4 justify-content-center">
          <div class="col-6 col-md-4" v-for="(feature, index) in features" :key="feature.icon">
            <div class="card h-100 shadow-sm feature-card animate-pop" :style="{ animationDelay: `${index * 80}ms` }">
              <div class="card-body text-center p-2 p-sm-3 p-md-4">
                <span :class="['feature-icon', getIconColorClass(feature.color)]">
                  <i :class="['fas', feature.icon]" aria-hidden="true"></i>
                </span>
                <h5 class="card-title mt-2 mb-1 mt-md-3 mb-md-2">{{ feature.title }}</h5>
                <p class="card-text text-secondary small">{{ feature.text }}</p>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </section>

    <!-- About & Info Section -->
    <section class="about-section section-spacing">
      <div class="container-lg px-3 px-md-4">
        <div class="row g-3 g-lg-5 align-items-stretch">
          <div class="col-lg-5 order-1 order-lg-2">
            <transition name="fade-slide-right">
              <div class="about-visual-section">
                <div class="about-image-container mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                    alt="Students collaborating on tech projects" 
                    class="img-fluid rounded-3 shadow-lg"
                    onerror="this.src='https://placehold.co/600x400/e9ecef/0d6efd?text=Tech+Collaboration&font=open-sans';this.onerror=null;"
                  />
                </div>
                
                <div class="info-cards">
                  <div class="card info-card mb-3 animate-pop" style="animation-delay: 200ms;">
                    <div class="card-body p-3">
                      <p class="fw-bold text-primary mb-2">
                        <i class="fas fa-rocket me-2"></i>What We Offer
                      </p>
                      <ul class="list-unstyled small mb-0">
                        <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i>Hackathons & coding challenges</li>
                        <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i>Industry-focused workshops</li>
                        <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i>Peer code reviews & feedback</li>
                        <li><i class="fas fa-check-circle text-success me-2"></i>Portfolio generation tools</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div class="card info-card animate-pop" style="animation-delay: 400ms;">
                    <div class="card-body p-3">
                      <p class="fw-bold text-primary mb-2">
                        <i class="fas fa-map-signs me-2"></i>Your Journey
                      </p>
                      <div class="journey-steps">
                        <div class="step-item d-flex align-items-center mb-2">
                          <span class="step-number text-caption">1</span>
                          <span class="step-text small">Sign in with your student account</span>
                        </div>
                        <div class="step-item d-flex align-items-center mb-2">
                          <span class="step-number text-caption">2</span>
                          <span class="step-text small">Join events or request new ones</span>
                        </div>
                        <div class="step-item d-flex align-items-center mb-2">
                          <span class="step-number text-caption">3</span>
                          <span class="step-text small">Collaborate and build projects</span>
                        </div>
                        <div class="step-item d-flex align-items-center">
                          <span class="step-number text-caption">4</span>
                          <span class="step-text small">Earn XP and showcase your work</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
          
          <div class="col-lg-7 order-2 order-lg-1">
            <transition name="fade-slide-left">
              <div class="about-content h-100 d-flex flex-column justify-content-center">
                <div class="about-header mb-4">
                  <h2 class="h2 fw-bold text-primary mb-3">
                    Empowering <span class="brand-highlight">MCA Students</span> Through Technology
                  </h2>
                  <p class="lead text-secondary mb-4">
                    The {{ communityConfig.name }} is where innovation meets education. We bridge the gap between academic learning and industry demands through hands-on projects, collaborative events, and peer-to-peer growth.
                  </p>
                </div>
                
                <div class="about-pillars row g-2 g-md-3 mb-4">
                  <div class="col-6 col-lg-6">
                    <div class="pillar-card h-100 p-2 p-sm-3 rounded border">
                      <div class="pillar-icon mb-1 mb-md-2">
                        <i class="fas fa-code text-primary"></i>
                      </div>
                      <h5 class="fw-bold mb-1 mb-md-2">Real-World Experience</h5>
                      <p class="small text-secondary mb-0">Build production-ready applications with cutting-edge technologies.</p>
                    </div>
                  </div>
                  <div class="col-6 col-lg-6">
                    <div class="pillar-card h-100 p-2 p-sm-3 rounded border">
                      <div class="pillar-icon mb-1 mb-md-2">
                        <i class="fas fa-users text-info"></i>
                      </div>
                      <h5 class="fw-bold mb-1 mb-md-2">Collaborative Growth</h5>
                      <p class="small text-secondary mb-0">Learn from peers, share knowledge, and develop essential teamwork skills through guided mentorship.</p>
                    </div>
                  </div>
                  <div class="col-6 col-lg-6">
                    <div class="pillar-card h-100 p-2 p-sm-3 rounded border">
                      <div class="pillar-icon mb-1 mb-md-2">
                        <i class="fas fa-briefcase text-success"></i>
                      </div>
                      <h5 class="fw-bold mb-1 mb-md-2">Career Readiness</h5>
                      <p class="small text-secondary mb-0">Build a compelling portfolio and develop skills that employers actively seek in the tech industry.</p>
                    </div>
                  </div>
                  <div class="col-6 col-lg-6">
                    <div class="pillar-card h-100 p-2 p-sm-3 rounded border">
                      <div class="pillar-icon mb-1 mb-md-2">
                        <i class="fas fa-trophy text-warning"></i>
                      </div>
                      <h5 class="fw-bold mb-1 mb-md-2">Recognition System</h5>
                      <p class="small text-secondary mb-0">Earn XP, climb leaderboards, and receive recognition for your contributions and achievements.</p>
                    </div>
                  </div>
                </div>
                
                <div class="about-stats d-flex flex-wrap gap-3">
                  <div class="stat-item">
                    <div class="stat-number h4 text-primary fw-bold">30+</div>
                    <div class="stat-label text-caption text-secondary">Active Students</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number h4 text-info fw-bold">5+</div>
                    <div class="stat-label text-caption text-secondary">Projects Completed</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number h4 text-success fw-bold">5+</div>
                    <div class="stat-label text-caption text-secondary">Events Hosted</div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Sponsorship & Contact Section -->
    <section class="sponsor-section section-spacing bg-gradient-light">
      <div class="container-lg">
        <div class="row g-4 align-items-center">
          <div class="col-md-7">
            <transition name="fade-slide-left">
              <div>
                <h3 class="fw-bold text-primary mb-3"><i class="fas fa-hand-holding-heart me-2" aria-hidden="true"></i> Sponsor the Tech Community</h3>
                <p class="text-secondary mb-2">
                  We welcome sponsorships and partnerships from organizations, companies, and individuals who wish to support student innovation and skill development. Sponsoring the {{ communityConfig.name }} helps us organize more impactful events, provide better resources, and empower the next generation of tech professionals.
                </p>
                <p class="text-secondary mb-2">
                  If you are interested in sponsoring or collaborating with us, please contact the MCA department at KMCT School Of Business or reach out via our social channels below.
                </p>
              </div>
            </transition>
          </div>
          <div class="col-md-5">
            <transition name="fade-slide-right">
              <div class="contact-card card shadow-sm animate-pop">
                <div class="card-body text-center">
                  <h5 class="mb-3 text-primary"><i class="fas fa-envelope me-2" aria-hidden="true"></i>Contact & Socials</h5>
                  <p class="text-secondary small mb-3">For questions or suggestions, reach out to the MCA department or connect with us on:</p>
                  <div class="mb-3">
                    <a href="https://instagram.com/" target="_blank" rel="noopener" class="text-secondary me-3" aria-label="Instagram">
                      <i class="fab fa-instagram fa-lg"></i>
                    </a>
                    <a href="mailto:labkmct@gmail.com" class="text-secondary me-3" aria-label="Email">
                      <i class="fas fa-envelope fa-lg"></i>
                    </a>
                    <a href="https://github.com/" target="_blank" rel="noopener" class="text-secondary" aria-label="GitHub">
                      <i class="fab fa-github fa-lg"></i>
                    </a>
                  </div>
                  <router-link to="/transparency" class="btn btn-outline-primary btn-sm btn-icon">
                    <i class="fas fa-eye me-2"></i> Community Transparency
                  </router-link>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer mt-5 py-4 border-top">
      <div class="container">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
           <p class="text-muted small mb-0">&copy; {{ new Date().getFullYear() }} {{ communityConfig.name }}. All rights reserved.</p>
           <div class="d-flex gap-3">
             <router-link to="/legal" class="text-muted small text-decoration-none">Terms & Privacy</router-link>
           </div>
        </div>
        <p class="mt-3 small text-muted text-center">
          This site is managed by the MCA department of KMCT School Of Business.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { communityConfig } from '@/config/community.config';

interface Feature {
    icon: string;
    color: 'primary' | 'info' | 'secondary' | 'warning' | 'success' | 'danger';
    title: string;
    text: string;
}

const features = ref<Feature[]>([
  { icon: 'fa-calendar-alt', color: 'primary', title: 'Events', text: 'View upcoming and past events.' },
  { icon: 'fa-plus-circle', color: 'info', title: 'Request Events', text: 'Request new events and activities.' },
  { icon: 'fa-users', color: 'secondary', title: 'Teamwork', text: 'Participate in team-based events.' },
  { icon: 'fa-star', color: 'warning', title: 'Feedback', text: 'Rate projects and provide feedback.' },
  { icon: 'fa-trophy', color: 'primary', title: 'Leaderboards', text: 'View leaderboards based on XP.' },
  { icon: 'fa-file-pdf', color: 'danger', title: 'Portfolio', text: 'Generate a portfolio of your achievements.' }
]);

const getIconColorClass = (color: Feature['color']): string => {
    switch (color) {
        case 'primary': return 'text-primary';
        case 'info': return 'text-info';
        case 'secondary': return 'text-secondary';
        case 'warning': return 'text-warning';
        case 'success': return 'text-success';
        case 'danger': return 'text-danger';
        default: return 'text-dark';
    }
};
</script>

<style lang="scss" scoped>
/* General Layout */
.landing-section {
  background: linear-gradient(135deg, var(--bs-light) 0%, var(--bs-primary-bg-subtle) 100%);
  min-height: 100vh;
  overflow-x: hidden; 
  padding-top: 0; /* Added to remove any default padding */
}

/* Welcome Section */
.welcome-section {
  min-height: 70vh;
  background: linear-gradient(120deg, var(--bs-primary-bg-subtle) 0%, var(--bs-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0 2rem; /* Reduced top padding */
}

@media (max-width: 767.98px) {
  .welcome-section {
    min-height: 45vh; /* Further reduced from 50vh */
    padding: 0 0 0.5rem; /* Removed top padding completely */
  }
  
  .welcome-section h1 {
    line-height: 1.3;
    margin-bottom: 0.75rem !important; /* Reduced from 1rem */
  }
  
  .welcome-section .lead {
    margin-bottom: 1.25rem !important; /* Reduced from 1.5rem */
  }
  
  .welcome-section .btn-lg {
    padding: 0.6rem 1.25rem; /* Reduced from 0.75rem 1.5rem */
    gap: 0.5rem;
  }
}

.text-gradient {
  background: linear-gradient(90deg, var(--bs-primary) 30%, var(--bs-info) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-highlight {
  color: var(--bs-primary);
  font-weight: 700;
}

/* .animate-pop class is global and uses popIn keyframes from _animations.scss */
/* Local @keyframes pop-in and .animate-pop class definition removed. */

/* Features Section */
.features-section {
  background: var(--bs-white);
  border-radius: var(--bs-border-radius-xl);
  margin-top: -2rem;
  box-shadow: var(--bs-box-shadow-lg);
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

@media (max-width: 767.98px) {
  .features-section {
    margin-top: -1rem; /* Reduced from -1.5rem */
    padding-top: 1.5rem; /* Reduced from 2rem */
    padding-bottom: 1.5rem; /* Reduced from 2rem */
    border-radius: var(--bs-border-radius-lg);
  }
}

.feature-card {
  border: none;
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: var(--bs-light);
}

.feature-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: var(--bs-box-shadow-lg);
}

@media (max-width: 767.98px) {
  .feature-card {
    margin-bottom: 1rem;
  }
  
  .feature-card .card-body {
    padding: 1.5rem 1rem;
  }
  
  .feature-card:hover {
    transform: translateY(-3px) scale(1.01);
  }
}

  .feature-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: var(--bs-primary-bg-subtle);
    margin-bottom: 0.5rem;
    box-shadow: var(--bs-box-shadow-sm);
  }

@media (max-width: 767.98px) {
  .feature-icon {
    width: 3rem;
    height: 3rem;
  }
}

/* About Section */
.about-section {
  background: linear-gradient(120deg, var(--bs-light) 60%, var(--bs-primary-bg-subtle) 100%);
  border-radius: var(--bs-border-radius-xl);
  margin-top: 2rem;
  overflow: hidden;
}

@media (max-width: 767.98px) {
  .about-section {
    margin-top: 1rem; /* Reduced from 1.5rem */
    border-radius: var(--bs-border-radius-lg);
    padding: 1.5rem 0 !important; /* Reduced from 2rem */
  }
  
  .about-section .display-6 {
    line-height: 1.3;
    text-align: center;
  }
  
  .about-section .lead {
    text-align: center;
    margin-bottom: 2rem !important;
  }
  
  .about-section .about-pillars {
    margin-bottom: 1.5rem !important; /* Reduced from 2rem */
  }
  
  .about-section .pillar-card {
    text-align: center;
    padding: 1.25rem !important;
  }
  
  .about-section .about-stats {
    justify-content: center;
    margin-bottom: 1rem !important; /* Reduced from 2rem */
  }
}

.about-content {
  @media (max-width: 991.98px) {
    text-align: center;
  }
}

.about-header .display-6 {
  @media (max-width: 767.98px) {
    font-size: 1.5rem;
  }
}

.pillar-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-border-color);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--bs-primary);
    box-shadow: var(--bs-box-shadow-sm);
    transform: translateY(-2px);
  }
}

@media (max-width: 575.98px) {
  .pillar-card {
    margin-bottom: 0.75rem;
  }
}

    .pillar-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bs-light);
      border-radius: 50%;
    }

@media (max-width: 767.98px) {
  .pillar-icon {
    margin: 0 auto 0.75rem auto;
  }
}

.about-stats {
  @media (max-width: 991.98px) {
    justify-content: center;
  }
  
  .stat-item {
    text-align: center;
    min-width: 80px;
    
    .stat-number {
      line-height: 1.2;
    }
  }
}

@media (max-width: 575.98px) {
  .about-stats .stat-item {
    min-width: 70px;
  }
}

.about-image-container {
  position: relative;
  overflow: hidden;
  
  img {
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }
}

@media (max-width: 991.98px) {
  .about-image-container {
    max-width: 500px;
    margin: 0 auto;
  }
}

@media (max-width: 767.98px) {
  .about-image-container {
    max-width: 100%;
    margin-bottom: 2rem !important;
  }
}

.info-cards .info-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-border-color);
  
  .step-number {
    width: 24px;
    height: 24px;
    background: var(--bs-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
  
  .step-text {
    line-height: 1.4;
  }
}

@media (max-width: 991.98px) {
  .info-cards {
    max-width: 400px;
    margin: 0 auto;
  }
}

@media (max-width: 767.98px) {
  .info-cards {
    max-width: 100%;
  }
  
  .info-cards .step-number {
    width: 20px;
    height: 20px;
    margin-right: 0.5rem;
  }
}

/* Sponsor Section */
.sponsor-section {
  background: linear-gradient(120deg, var(--bs-primary-bg-subtle) 0%, var(--bs-light) 100%);
  border-radius: var(--bs-border-radius-xl);
  margin-top: 2rem;
}

@media (max-width: 767.98px) {
  .sponsor-section {
    margin-top: 1rem; /* Reduced from 1.5rem */
    border-radius: var(--bs-border-radius-lg);
    padding: 1.5rem 0 !important; /* Reduced from 2rem */
  }
  
  .sponsor-section h3 {
    text-align: center;
    margin-bottom: 1.5rem !important;
  }
  
  .sponsor-section p {
    text-align: center;
  }
}

/* Footer */
.landing-footer {
  background: var(--bs-white);
  border-radius: var(--bs-border-radius-xl) var(--bs-border-radius-xl) 0 0;
  box-shadow: var(--bs-box-shadow-sm);
  margin-top: 1.5rem;
  padding-bottom: 0.5rem;
}

@media (max-width: 767.98px) {
  .landing-footer {
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
    padding: 1rem 0 0.75rem 0 !important; /* Reduced from 1.5rem 0 1rem 0 */
    margin-top: 0.75rem; /* Reduced from 1rem */
  }
  
  .landing-footer p:last-child {
    margin-top: 0.75rem !important; /* Reduced from 1rem */
  }
}

/* Animations */
/* Local Vue transition definitions for fade-slide-* removed. */
/* They are globally available from _animations.scss. */

/* About Section Enhancements */
.about-section {
  .about-content {
    @media (max-width: 991.98px) {
      text-align: center;
    }
  }
  
      .about-header {
      .display-6 {
        @media (max-width: 767.98px) {
          /* Use standard h2 class */
        }
      }
    }
  
  .pillar-card {
    background: var(--bs-white);
    border: 1px solid var(--bs-border-color);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: var(--bs-primary);
      box-shadow: var(--bs-box-shadow-sm);
      transform: translateY(-2px);
    }
  }
  
  .pillar-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bs-light);
    border-radius: 50%;
  }
}

/* Mobile-first responsive improvements for Landing page */
@media (max-width: 575.98px) {
  .about-section {
    .about-pillars .col-sm-6 {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
  
  // Better mobile typography
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.3;
  }
  
  // Reduce excessive padding on mobile
  .py-5 {
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
  }
  
  .py-4 {
    padding-top: 1.5rem !important;
    padding-bottom: 1.5rem !important;
  }
  
  // Better mobile grid spacing
  .g-3 {
    --bs-gutter-x: 0.75rem;
    --bs-gutter-y: 0.75rem;
  }
  
  .g-4 {
    --bs-gutter-x: 1rem;
    --bs-gutter-y: 1rem;
  }
  
  // Improve spacing between sections
  section {
    margin-top: 1rem !important;
  }
}

/* Touch-friendly improvements for landing page */
@media (hover: none) and (pointer: coarse) {
  .feature-card:hover,
  .pillar-card:hover {
    transform: none;
  }
}

/* Utility .text-decoration-underline-hover:hover is defined globally in main.scss */
</style>

