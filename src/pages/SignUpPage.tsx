import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Link, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Loader2, Moon, Sun } from 'lucide-react';

type SignUpStep = 'details' | 'phone';

export default function SignUpPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const [step, setStep] = useState<SignUpStep>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setIsLoading(true);
      setError('');
      try {
        // Store all fields in localStorage before Google login completes
        localStorage.setItem('signup_first_name', firstName);
        localStorage.setItem('signup_last_name', lastName);
        localStorage.setItem('signup_address', address);
        localStorage.setItem('signup_date_of_birth', dateOfBirth);
        
        const { authApi } = await import('@/lib/api');
        const data = await authApi.googleAuth(credentialResponse.access_token);
        
        // If login successful, set the tokens and redirect
        if (data.access && data.refresh) {
          // Store tokens in localStorage for useAuth hook
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          // Store email for phone verification
          localStorage.setItem('pending_email', data.user.email);
          window.location.href = '/signup?step=phone';
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
    },
    scope: 'openid email profile',
  });
  
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'phone') {
      setStep('phone');
      // Get email and other fields from localStorage if available
      const storedEmail = localStorage.getItem('pending_email');
      const storedFirstName = localStorage.getItem('signup_first_name');
      const storedLastName = localStorage.getItem('signup_last_name');
      const storedAddress = localStorage.getItem('signup_address');
      const storedDob = localStorage.getItem('signup_date_of_birth');
      
      if (storedEmail) setEmail(storedEmail);
      if (storedFirstName) setFirstName(storedFirstName);
      if (storedLastName) setLastName(storedLastName);
      if (storedAddress) setAddress(storedAddress);
      if (storedDob) setDateOfBirth(storedDob);
    }
  }, [searchParams]);
  
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { otpApi } = await import('@/lib/api');
      await otpApi.sendOTP(phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { otpApi } = await import('@/lib/api');
      await otpApi.verifyOTP(phoneNumber, otpCode, email, firstName, lastName, address, dateOfBirth);
      // After verification, redirect to login or show success
      window.location.href = '/login?verified=true';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToPhoneStep = () => {
    if ( !firstName || !lastName) {
      setError('Please fill in all required fields');
      return;
    }
    setStep('phone');
  };
  
  const goBack = () => {
    setStep('details');
    setOtpSent(false);
    setOtpCode('');
  };

  return (
    <>
      <style>{`
        .lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          margin: auto;
          width: 90vw;
          z-index: 0;
          pointer-events: none;
        }
        .line {
          position: absolute;
          width: 1px;
          height: 100%;
          top: 0;
          left: 50%;
          background: rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .dark .line {
          background: rgba(255, 255, 255, 0.1);
        }
        .line::after {
          content: '';
          display: block;
          position: absolute;
          height: 15vh;
          width: 100%;
          top: -50%;
          left: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, #000000 75%, #000000 100%);
          animation: drop 7s 0s infinite;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.4, 0.26, 0, 0.97);
        }
        .dark .line::after {
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 75%, #ffffff 100%);
        }
        .line:nth-child(1) { margin-left: -25%; }
        .line:nth-child(1)::after { animation-delay: 2s; }
        .line:nth-child(3) { margin-left: 25%; }
        .line:nth-child(3)::after { animation-delay: 2.5s; }
        @keyframes drop {
          0% { top: -50%; }
          100% { top: 110%; }
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4 relative overflow-hidden">
        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2 z-10"> 
          <Button variant="outline" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
            {i18n.language === 'en' ? 'ع' : 'EN'}
          </Button>
          <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        
        {step === 'details' ? (
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center dark:text-white">Sign Up</CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                Create your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="dark:text-white">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="dark:text-white">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
             
              
             
              
              <div className="space-y-2">
                <Label htmlFor="address" className="dark:text-white">Address</Label>
                <Input
                  id="address"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="dark:text-white">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => googleLogin()}
                disabled={isLoading}
              >
                Sign up with Google
              </Button>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" onClick={goToPhoneStep} disabled={isLoading}>
                Continue to Phone Verification
              </Button>
              <p className="text-sm text-center text-muted-foreground dark:text-gray-400">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
              </p>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center dark:text-white">Phone Verification</CardTitle>
              <CardDescription className="text-center dark:text-gray-400">
                {otpSent ? 'Enter the code sent to your phone' : 'Enter your phone number'}
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {!otpSent ? (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="dark:text-white">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otpCode" className="dark:text-white">Verification Code</Label>
                    <Input
                      id="otpCode"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {otpSent ? 'Verifying...' : 'Sending...'}
                    </>
                  ) : otpSent ? (
                    'Verify & Complete Sign Up'
                  ) : (
                    'Send Code'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={goBack}
                  disabled={isLoading}
                >
                  Go Back
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}