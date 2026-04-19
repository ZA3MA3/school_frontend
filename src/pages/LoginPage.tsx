import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Navigate } from 'react-router-dom';
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
import { Eye, EyeOff, GraduationCap, Loader2, Moon, Sun } from 'lucide-react';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
  };

return (
<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4">
      <div className="absolute top-4 right-4 flex gap-2"> 
        <Button variant="outline" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
          {i18n.language === 'en' ? 'ع' : 'EN'}
        </Button>
        <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
       
      </div>
      <Card className="w-full max-w-md dark:bg-zinc-800">
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
  );
}
