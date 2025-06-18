// Re-export for backward compatibility
export { authService as apiService } from './authService';

// Export the default as the auth service
import { authService } from './authService';
export default authService; 