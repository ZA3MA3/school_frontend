import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, MessageSquare, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsAuthenticated } from '@/stores/authStore';
import { useTranslation } from 'react-i18next';
import  TypeWriter  from '@/components/TypeWriter.tsx'
import slide1 from '@/assets/parent_dashboard.png';
import slide2 from '@/assets/student_dashboard.png';
import slide3 from '@/assets/teacher_dashboard.png';
import appScreenshot2 from '@/assets/Notifications.jpg';
import appScreenshot1 from '@/assets/login.jpg';
import appScreenshot3 from '@/assets/chat.jpg';
import googlePlayButton from '@/assets/google_play.webp'
const VITE_API_URL = import.meta.env.VITE_API_URL;

export default function LandingPage() {
  const isAuthenticated = useIsAuthenticated();
  const { t, i18n } = useTranslation();

  const appImages = [appScreenshot1, appScreenshot2, appScreenshot3];
  const heroImages = [slide1, slide2, slide3];
  const [heroIndex, setHeroIndex] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [contactResponseMsg, setContactResponseMsg] = useState('');

  useEffect(() => {
    if (contactResponseMsg) {
      const timer = setTimeout(() => {
        setContactResponseMsg('');
        setContactStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [contactResponseMsg]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [appIndex, setAppIndex] = useState(0);
  const heroImagesCount = 3;
  const appImagesCount = 3;

  const nextHero = () => setHeroIndex((prev) => (prev + 1) % heroImagesCount);
  const prevHero = () => setHeroIndex((prev) => (prev - 1 + heroImagesCount) % heroImagesCount);
  const nextApp = () => setAppIndex((prev) => (prev + 1) % appImagesCount);
  const prevApp = () => setAppIndex((prev) => (prev - 1 + appImagesCount) % appImagesCount);

  // Redirect authenticated users to the dashboard routing logic
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      setContactStatus('error');
      setContactResponseMsg('Please fill in all fields.');
      return;
    }

    setContactStatus('loading');
    try {
      const res = await fetch(`${VITE_API_URL}/users/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage
        })
      });

      const data = await res.json();

      if (res.ok) {
        setContactStatus('success');
        setContactResponseMsg(data.detail || 'Your message has been sent successfully.');
        setContactName('');
        setContactEmail('');
        setContactMessage('');
      } else {
        setContactStatus('error');
        setContactResponseMsg(data.detail || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setContactStatus('error');
      setContactResponseMsg('An error occurred. Please try again later.');
}
  };

  return (
    <>
      <style>{`
        .landing-bg-new {
          background-color: #171717;
          position: relative;
          overflow: hidden;
        }
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
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .line::after {
          content: '';
          display: block;
          position: absolute;
          height: 15vh;
          width: 100%;
          top: -50%;
          left: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #ffffff 75%, #ffffff 100%);
          animation: drop 7s 0s infinite;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.4, 0.26, 0, 0.97);
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
      <div className="min-h-screen landing-bg-new text-white font-sans selection:bg-white/30 selection:text-white">
        <div className="lines">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
        
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-white" strokeWidth={1.5} />
            <span className="text-2xl font-extrabold tracking-tighter uppercase">Mouktassab</span>
          </div>
          <div className="flex items-center space-x-8">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
              {i18n.language === 'en' ? 'ع' : 'EN'}
            </Button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-bold tracking-widest text-white/70 hover:text-white transition-colors uppercase"
            >
              {t('landing.contactUs')}
            </button>
<Link to="/login">
              <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-none px-8 h-12 uppercase tracking-widest text-xs font-bold transition-all">
              {t('landing.signIn')}
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-8 h-12 uppercase tracking-widest text-xs font-bold transition-all">
              {t('landing.signUp')}
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-10 flex flex-col items-center text-center gap-12 relative z-10">
          <div className="max-w-5xl space-y-10 relative">
            {/* <div className="slider-thumb-wrapper">
              <div className="slider-thumb"></div>
            </div> */}
            <h1 className="text-6xl md:text-[7rem] font-black leading-[0.95] tracking-tighter uppercase relative">
            <span className="block min-w-[10ch]" style={{ minWidth: 'max-content' }}><TypeWriter /></span> <span className="inline-block" style={{ minWidth: 'max-content' }}>{t('landing.management')}</span>  <br/> <span className="inline-block text-white/60 " style={{ minWidth: 'max-content' }}>{t('landing.reimagined')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light leading-relaxed max-w-3xl mx-auto relative">
            {t('landing.description')}
            </p>
<div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 relative">
              <Link to="/signup">
                <Button className="bg-white text-black hover:bg-gray-200 rounded-none h-14 px-10 text-sm font-bold uppercase tracking-[0.2em] transition-all">
                  {t('landing.getStarted')}
                </Button>
              </Link>
<Link to="#features">
                <Button variant="ghost" className="text-white hover:bg-white/10 rounded-none h-14 px-10 text-sm font-bold uppercase tracking-[0.2em] transition-all border border-white/20">
                {t('landing.learnMore')}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="w-full max-w-6xl mt-16 relative">
         
          <div className="w-full aspect-[16/9] bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative overflow-hidden group">
  
  {/* ✅ Image Container - Place this first */}
  <img 
    src={heroImages[heroIndex]} 
    alt={`Hero slide ${heroIndex + 1}`}
    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
  />

  {/* Overlay gradient for better text readability (optional) */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

  {/* Navigation Buttons */}
  <button onClick={prevHero} className="absolute left-4 z-20 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
    <ChevronLeft className="h-8 w-8" />
  </button>
  <button onClick={nextHero} className="absolute right-4 z-20 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
    <ChevronRight className="h-8 w-8" />
  </button>

   
{/*  <div className="flex flex-col items-center text-white/30 space-y-4 z-10 text-center px-4">
    <span className="text-sm md:text-lg uppercase tracking-[0.3em] font-light">
      [ Hero {heroIndex + 1} ]
    </span>
  </div>*/}

  {/* Dots Indicator */}
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
    {Array.from({ length: heroImagesCount }).map((_, i) => (
      <div 
        key={i} 
        className={`h-1.5 rounded-full transition-all cursor-pointer ${i === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
        onClick={() => setHeroIndex(i)}
      />
    ))}
  </div>
</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[#050505] py-32 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="mb-24 space-y-6">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">{t('landing.meaning')} <br/> {t('landing.meaning1')}</h2>
            <p className="text-white/50 text-2xl font-light max-w-2xl">
              {t('landing.meaningDesc')}.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <Users className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">{t('landing.teachers')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
                {t('landing.teachersD')}.
              </CardContent>
            </Card>

            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <MessageSquare className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">{t('landing.parents')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
                {t('landing.parentsD')}.
              </CardContent>
            </Card>

            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <BookOpen className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">{t('landing.students')}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
               {t('landing.studentsD')}.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
<section className="container mx-auto px-6 py-40 flex flex-col-reverse lg:flex-row items-center gap-24">
  <div className="flex-1 w-full flex justify-center lg:justify-end">
    {/* App Mockup Image Placeholder */}
    <div className="w-full max-w-[360px]   aspect-[9/16] bg-[#0a0a0a] border border-white/10 relative overflow-hidden group">
      {/* h-[810px]*/}
      {/* ✅ Image Container - Add this */}
      <img 
        src={appImages[appIndex]} 
        alt={`App screenshot ${appIndex + 1}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
      />

      {/* Optional: Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Navigation Buttons */}
      <button onClick={prevApp} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={nextApp} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Text Overlay (optional - can remove if images speak for themselves) */}
      <div className="absolute bottom-20 left-0 right-0 text-center z-10 px-4">
        <span className="text-white/40 text-xs uppercase tracking-[0.3em] font-light bg-black/30 px-3 py-1 rounded-full">
          {appIndex + 1} / {appImagesCount}
        </span>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {Array.from({ length: appImagesCount }).map((_, i) => (
          <button 
            key={i} 
            onClick={() => setAppIndex(i)}
            className={`h-1 rounded-full transition-all cursor-pointer ${i === appIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  </div>
  
  <div className="flex-1 space-y-12">
    <h2 className="text-6xl md:text-[6rem] font-black leading-[0.95] tracking-tighter uppercase">
      {t('landing.school')}. <br/> 
      <span className="text-white/40">{t('landing.anywhere')}.</span>
    </h2>
    <p className="text-2xl text-white/50 font-light leading-relaxed max-w-xl">
      {t('landing.schoolAnywhereD')}
    </p>
    <div className="pt-6">
            <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white h-16 px-10 rounded-none flex items-center gap-5 transition-all">
             
              <div className="flex flex-col items-start">
             
                  <img 
                       src={googlePlayButton} 
                       alt="Get it on Google Play"
                       className="h-12 w-auto"  
                  />
              </div>
            </Button>
          </div>
  </div>
</section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-6 py-25  pb-5 border-t border-white/10">
        <div className="max-w-2xl mx-auto space-y-12 text-center">
          <div className="space-y-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase">{t('landing.getInTouch')}</h2>
            <p className="text-white/50 text-xl font-light">
              {t('landing.getInTouchD')}
            </p>
          </div>
          
          <form className="space-y-6 text-left" onSubmit={handleContactSubmit}>
            {contactStatus === 'success' && (
              <div className="bg-green-500/20 text-green-400 border border-green-500/50 p-4 text-sm font-bold uppercase tracking-widest text-center">
                {contactResponseMsg}
              </div>
            )}
            {contactStatus === 'error' && (
              <div className="bg-red-500/20 text-red-400 border border-red-500/50 p-4 text-sm font-bold uppercase tracking-widest text-center">
                {contactResponseMsg}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/70">{t('landing.name')}</label>
                <Input 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-none" 
                  disabled={contactStatus === 'loading'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/70">{t('landing.email')}</label>
                <Input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john@example.com" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-none" 
                  disabled={contactStatus === 'loading'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-white/70">{t('landing.message')}</label>
              <textarea 
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="How can we help you?" 
                className="flex min-h-[150px] w-full border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-none"
                disabled={contactStatus === 'loading'}
              />
            </div>
            <Button 
              type="submit"
              disabled={contactStatus === 'loading'}
              className="w-full bg-white text-black hover:bg-gray-200 h-14 rounded-none text-sm font-bold uppercase tracking-[0.2em] transition-all"
            >
              {contactStatus === 'loading' ? t('landing.sending') : t('landing.sendMessage')}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-white" strokeWidth={1.5} />
            <span className="text-xl font-black text-white tracking-tighter uppercase">Mouktassab</span>
          </div>
          <p className="text-white/30 text-xs font-bold tracking-[0.15em] uppercase">
            © {new Date().getFullYear()} Mouktassab. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* Go to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 p-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-none backdrop-blur-md transition-all duration-300 z-50 group ${showTopBtn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Go to top"
      >
        <ArrowUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </div>
    </>
  );
}
