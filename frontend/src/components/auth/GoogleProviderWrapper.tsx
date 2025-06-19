import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID!;

export const GoogleProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  // Debug: Check if Client ID is configured
  if (!clientId || clientId === 'undefined') {
    console.error('VITE_GOOGLE_CLIENT_ID is not configured in .env file');
    console.error('Current value:', clientId);
    console.error('Please create frontend/.env file with: VITE_GOOGLE_CLIENT_ID=your-google-client-id');
    
    // Render children without Google provider to prevent crashes
    return <>{children}</>;
  }
  
  console.log('Google OAuth Client ID configured:', clientId.substring(0, 20) + '...');
  
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}; 