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