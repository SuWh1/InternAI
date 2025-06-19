import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onSuccess, 
  onError 
}) => {
  const { googleLoginWithToken } = useAuth();
  
  // Check if Google OAuth is configured
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'undefined') {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm font-medium">Google OAuth Not Configured</p>
        <p className="text-red-500 text-xs mt-1">
          Please create <code>frontend/.env</code> file with your Google Client ID
        </p>
      </div>
    );
  }

  const handleGoogleLogin = async (credential: string) => {
    try {
      await googleLoginWithToken(credential);
      onSuccess?.();
    } catch (err: any) {
      console.error('Google auth failed:', err);
      onError?.(err.message || 'Google authentication failed');
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const credential = credentialResponse.credential;
          if (!credential) {
            console.error('Missing Google credential');
            onError?.('Missing Google credential');
            return;
          }

          handleGoogleLogin(credential);
        }}
        onError={() => {
          console.log('Google Login Failed');
          onError?.('Google Login Failed');
        }}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        logo_alignment="left"
      />
    </div>
  );
}; 