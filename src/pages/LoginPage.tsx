import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
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
import { Eye, EyeOff,  Loader2, Moon, Sun } from 'lucide-react';
import { otpApi } from '@/lib/api';
import logo from '@/assets/mouktassab.png';


type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const authStore = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Subscription state
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ FIX: Use useEffect for redirect instead of early return before hooks.
  // The early return on line 49 (before useGoogleLogin) was causing
  // "Rendered fewer hooks than expected" because React called fewer
  // hooks when isAuthenticated was true.
useEffect(() => {
    localStorage.removeItem('pending_refresh_token');
  }, []);

  useEffect(() => {
    if (isAuthenticated && !needsSubscription) {
      const activeRole = authStore.activeRole;
      switch (activeRole) {
        case 'ADMIN': navigate('/admin'); break;
        case 'TEACHER': navigate('/teacher'); break;
        case 'STUDENT': navigate('/student'); break;
        case 'PARENT': navigate('/parent'); break;
        default: navigate('/');
      }
    }
  }, []);

  const checkSubscriptionAndRedirect = () => {
    const activeRole = authStore.activeRole;
    switch (activeRole) {
      case 'ADMIN': navigate('/admin'); break;
      case 'TEACHER': navigate('/teacher'); break;
      case 'STUDENT': navigate('/student'); break;
      case 'PARENT': navigate('/parent'); break;
      default: navigate('/');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result?.success) {
      try {
        const subData = await otpApi.getSubscriptionStatus();
        if (!subData.is_active_subscription) {
          setUserRoles(subData.roles || []);
          setNeedsSubscription(true);
        } else {
          checkSubscriptionAndRedirect();
        }
      } catch {
        checkSubscriptionAndRedirect();
      }
    }
  };

const handleSubscribe = async (planType: string) => {
    setIsSubmitting(true);
    try {
      const data = await otpApi.createSubscription(planType);
      if (data.checkout_url) {
        localStorage.setItem('pending_refresh_token', data.refresh_token);
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      setPhoneError(err.response?.data?.detail || 'Failed to create checkout');
      setIsSubmitting(false);
    }
  };

  const handlePhoneSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setIsSubmitting(true);
    try {
      await otpApi.phoneLoginSend(phoneNumber);
      setOtpSent(true);
    } catch (err: any) {
      setPhoneError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setIsSubmitting(true);
    try {
      const data = await otpApi.phoneLoginVerify(phoneNumber, otpCode);

      authStore.login({
        id: data.user?.id || 0,
        email: data.user?.email || '',
        firstName: data.user?.first_name,
        lastName: data.user?.last_name,
        fullName: data.user?.first_name + ' ' + data.user?.last_name,
        roles: data.roles || [],
      });

      try {
        const subData = await otpApi.getSubscriptionStatus();
        if (!subData.is_active_subscription) {
          setUserRoles(subData.roles || []);
          setNeedsSubscription(true);
        } else {
          checkSubscriptionAndRedirect();
        }
      } catch {
        checkSubscriptionAndRedirect();
      }
    } catch (err: any) {
      setPhoneError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ useGoogleLogin is now always called — no early returns above it
  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setIsSubmitting(true);
      try {
        const data = await otpApi.googleLoginOnly(credentialResponse.access_token);

        authStore.login({
          id: data.user?.id || 0,
          email: data.user?.email || '',
          firstName: data.user?.first_name,
          lastName: data.user?.last_name,
          fullName: data.user?.first_name + ' ' + data.user?.last_name,
          roles: data.roles || [],
        });

        

        try {
          const subData = await otpApi.getSubscriptionStatus();
          
          if (!subData.is_active_subscription) {
            setUserRoles(subData.roles || []);
            setNeedsSubscription(true);
          } else {
            checkSubscriptionAndRedirect();
          }
        } catch {
          checkSubscriptionAndRedirect();
        }
      } catch (err: any) {
        setPhoneError(err.response?.data?.detail || 'Google login failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setPhoneError('Google login failed');
    },
    scope: 'openid email profile',
  });

  // ✅ Subscription wall — rendered conditionally in JSX, not as early return
  if (needsSubscription) {
    const hasTeacher = userRoles.includes('TEACHER');
    const hasParent = userRoles.includes('PARENT');

    let planType = '';
    let planName = '';
    let planPrice = '';

    if (hasTeacher && hasParent) {
      planType = 'TEACHER_PARENT';
      planName = 'Teacher + Parent Plan';
      planPrice = '5,000 DZD';
    } else if (hasTeacher) {
      planType = 'TEACHER_ONLY';
      planName = 'Teacher Plan';
      planPrice = '3,000 DZD';
    } else if (hasParent) {
      planType = 'PARENT_ONLY';
      planName = 'Parent Plan';
      planPrice = '2,000 DZD';
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Subscription Required</CardTitle>
            <CardDescription>
              You need an active subscription to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-2">{planName}</h3>
              <p className="text-3xl font-bold text-primary mb-4">{planPrice}</p>
              <p className="text-muted-foreground text-sm mb-6">
                Get unlimited access to all features
              </p>
              <Button
                onClick={() => handleSubscribe(planType)}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        .line:nth-child(1) {
          margin-left: -25%;
        }
        .line:nth-child(1)::after {
          animation-delay: 2s;
        }
        .line:nth-child(3) {
          margin-left: 25%;
        }
        .line:nth-child(3)::after {
          animation-delay: 2.5s;
        }
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

        <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img 
      src={logo} 
      alt="Book icon"
      className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
    />
          <span className="text-2xl font-extrabold tracking-tighter uppercase dark:text-white text-gray-900">
            Mouktassab
          </span>
        </Link>

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            variant="outline"
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
          >
            {i18n.language === 'en' ? 'ع' : 'EN'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center ">
            <img 
            src={logo} 
            alt="Book icon"
            className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20"
          />
            </div>
            <CardTitle className="text-2xl text-center dark:text-white">Mouktassab</CardTitle>
            <CardDescription className="text-center dark:text-gray-400">
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>

          {/* Login Method Toggle */}
          <div className="flex border-b mx-4">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium ${
                loginMethod === 'email' ? 'border-b-2 border-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setLoginMethod('email')}
            >
               {t('login.email')}
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium ${
                loginMethod === 'phone' ? 'border-b-2 border-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setLoginMethod('phone')}
            >
               {t('login.phone')}
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-white">
                    {t('login.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.placeEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-white">
                    {t('login.password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('login.placePassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('login.loggingIn')}
                    </>
                  ) : (
                    t('login.login')
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={otpSent ? handlePhoneVerify : handlePhoneSendOTP}>
              <CardContent className="space-y-4">
                {phoneError && (
                  <Alert variant="destructive">
                    <AlertDescription>{phoneError}</AlertDescription>
                  </Alert>
                )}
                {!otpSent ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="dark:text-white">
                       {t('login.phoneNumber')}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="dark:text-white">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={isSubmitting}
                      maxLength={6}
                      required
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {otpSent ? 'Verifying...' : 'Sending...'}
                    </>
                  ) : otpSent ? (
                     t('login.verifyAndLogin')
                  ) : (
                     t('login.sendCode')
                  )}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center mx-4 my-2">
            <div className="flex-1 border-t"></div>
            <span className="px-3 text-sm text-muted-foreground">or</span>
            <div className="flex-1 border-t"></div>
          </div>

          {/* Google Login Button */}
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => googleLogin()}
              disabled={isSubmitting}
            >
               {t('login.withGoogle')}
            </Button>
          </CardFooter>

          <div className="text-center pb-4">
            <Link to="/signup" className="text-sm text-primary hover:underline">
              {t('login.dontHave')}
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}