import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID!;

export const GoogleProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}; 