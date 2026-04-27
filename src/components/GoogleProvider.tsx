import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleProviderProps {
  children: React.ReactNode;
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function GoogleProvider({ children }: GoogleProviderProps) {
  if (!clientId) {
    console.error('Google Client ID not found in environment variables');
    return <>{children}</>;
  }
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}