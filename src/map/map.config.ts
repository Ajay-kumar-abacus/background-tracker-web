export interface MapLibraryConfig {
  apiBaseUrl: string;
  imageBaseUrl?: string;

  // Functions (VERY IMPORTANT)
  getToken?: () => string | null;
  getUserId?: () => string | number | null;
  getUserData?: () => any;

  // Other project-specific values
  projectName?: string;
  timezone?: string;
  permissions?: any;
}
