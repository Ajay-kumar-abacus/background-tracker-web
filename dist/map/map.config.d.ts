export interface MapLibraryConfig {
    apiBaseUrl: string;
    imageBaseUrl?: string;
    getToken?: () => string | null;
    getUserId?: () => string | number | null;
    getUserData?: () => any;
    projectName?: string;
    timezone?: string;
    permissions?: any;
}
