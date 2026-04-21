import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthLoading as useAuthLoadingCheck } from '@/stores/authStore';
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
import { Eye, EyeOff, GraduationCap, Loader2, Moon, Sun } from 'lucide-react';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const authLoading = useAuthLoadingCheck();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
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
      <div className="absolute top-4 right-4 flex gap-2 z-10"> 
        <Button variant="outline" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
          {i18n.language === 'en' ? 'ع' : 'EN'}
        </Button>
        <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
       
      </div>
      <Card className="w-full max-w-md dark:bg-zinc-800 relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center dark:text-white">School Portal</CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
<div className="space-y-2">
              <Label htmlFor="email" className="dark:text-white">{t('login.email')}</Label>
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
              <Label htmlFor="password" className="dark:text-white">{t('login.password')}</Label>
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
      </Card>
    </div>
  </>
  );
}
