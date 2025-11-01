// Community configuration
// Customize these values to match your tech community

export interface CommunityConfig {
  name: string;
  shortName: string;
  description: string;
  tagline: string;
  email: string;
  website: string;
  logo?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  features: {
    enablePWA: boolean;
    enableNotifications: boolean;
    enableXPSystem: boolean;
    enableTeams: boolean;
    enableProjects: boolean;
  };
}

export const communityConfig: CommunityConfig = {
  name: import.meta.env.VITE_COMMUNITY_NAME || 'Tech Community',
  shortName: import.meta.env.VITE_COMMUNITY_SHORT_NAME || 'TechComm',
  description: import.meta.env.VITE_COMMUNITY_DESCRIPTION || 'A platform for tech enthusiasts to collaborate, learn, and grow together',
  tagline: import.meta.env.VITE_COMMUNITY_TAGLINE || 'Learn, Build, and Grow Together',
  email: import.meta.env.VITE_COMMUNITY_EMAIL || 'info@techcommunity.dev',
  website: import.meta.env.VITE_COMMUNITY_WEBSITE || 'https://techcommunity.dev',
  logo: import.meta.env.VITE_COMMUNITY_LOGO,
  theme: {
    primaryColor: import.meta.env.VITE_THEME_PRIMARY_COLOR || '#0d6efd',
    secondaryColor: import.meta.env.VITE_THEME_SECONDARY_COLOR || '#6c757d',
  },
  features: {
    enablePWA: import.meta.env.VITE_ENABLE_PWA !== 'false',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    enableXPSystem: import.meta.env.VITE_ENABLE_XP_SYSTEM !== 'false',
    enableTeams: import.meta.env.VITE_ENABLE_TEAMS !== 'false',
    enableProjects: import.meta.env.VITE_ENABLE_PROJECTS !== 'false',
  },
};

export default communityConfig;
