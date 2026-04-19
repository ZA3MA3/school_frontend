import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Users, BookOpen, MessageSquare } from 'lucide-react';
import { useIsAuthenticated } from '@/stores/authStore';
import  TypeWriter  from '@/components/TypeWriter.tsx'

export default function LandingPage() {
  const isAuthenticated = useIsAuthenticated();

  // Redirect authenticated users to the dashboard routing logic
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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
            <span className="text-2xl font-extrabold tracking-tighter uppercase">SmartSchool</span>
          </div>
          <div className="flex items-center space-x-8">
            
            <Link to="/login">
              <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-none px-8 h-12 uppercase tracking-widest text-xs font-bold transition-all">
              Sign In
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
            <span className="inline-block min-w-[4ch]"><TypeWriter /></span> Management <br/> <span className="text-white/60">Reimagined.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light leading-relaxed max-w-3xl mx-auto relative">
              A unified ecosystem designed to bridge the gap between education and communication.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 relative">
              <Link to="/login">
                <Button className="bg-white text-black hover:bg-gray-200 rounded-none h-14 px-10 text-sm font-bold uppercase tracking-[0.2em] transition-all">
                  Get Started
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="ghost" className="text-white hover:bg-white/10 rounded-none h-14 px-10 text-sm font-bold uppercase tracking-[0.2em] transition-all border border-white/20">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="w-full max-w-6xl mt-16 relative">
          {/* Hero Image Placeholder */}
          <div className="w-full aspect-[21/9] bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors duration-700" />
            <div className="flex flex-col items-center text-white/30 space-y-4 z-10 text-center px-4">
              <span className="text-sm md:text-lg uppercase tracking-[0.3em] font-light">[ Hero Video / Dashboard Image ]</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[#050505] py-32 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="mb-24 space-y-6">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">Meaningful <br/> Connections</h2>
            <p className="text-white/50 text-2xl font-light max-w-2xl">
              Our system ensures that everyone involved in the educational journey stays informed, engaged, and empowered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <Users className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">Teachers</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
                Streamline grading, attendance, and assignments. Communicate directly with parents and focus on what matters most: teaching.
              </CardContent>
            </Card>

            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <MessageSquare className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">Parents</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
                Stay updated on your child's academic progress. Receive real-time alerts, attendance reports, and direct messages from teachers.
              </CardContent>
            </Card>

            <Card className="bg-black border border-white/10 text-white rounded-none p-8 hover:bg-white/[0.03] transition-colors">
              <CardHeader className="px-0 pt-0">
                <BookOpen className="h-12 w-12 text-white mb-8" strokeWidth={1} />
                <CardTitle className="text-3xl font-bold tracking-tighter uppercase">Students</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 text-white/50 font-light leading-relaxed text-lg">
                Access learning materials, track grades, and submit assignments from anywhere. Your entire academic life in your pocket.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="container mx-auto px-6 py-40 flex flex-col-reverse lg:flex-row items-center gap-24">
        <div className="flex-1 w-full flex justify-center lg:justify-end">
          {/* App Mockup Image Placeholder */}
          <div className="w-full max-w-[340px] aspect-[9/16] bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative overflow-hidden">
             <div className="flex flex-col items-center text-white/30 space-y-4 text-center px-6 z-10">
              <span className="text-xs uppercase tracking-[0.3em] font-light">[ Mobile App ]</span>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-12">
          <h2 className="text-6xl md:text-[6rem] font-black leading-[0.95] tracking-tighter uppercase">
            School. <br/> <span className="text-white/40">Anywhere.</span>
          </h2>
          <p className="text-2xl text-white/50 font-light leading-relaxed max-w-xl">
            Download our official mobile application. 
            Stay connected with push notifications, on-the-go grading, and instant messaging.
          </p>
          <div className="pt-6">
            <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white h-16 px-10 rounded-none flex items-center gap-5 transition-all">
             
              <div className="flex flex-col items-start">
              {/*  <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] leading-none mb-1">Get it on</span>
                <span className="font-extrabold text-xl leading-none uppercase tracking-wide">Google Play</span>*/ }
                  <img 
                       src="src/assets/google_play.webp" 
                       alt="Get it on Google Play"
                       className="h-12 w-auto"  
                  />
              </div>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-white" strokeWidth={1.5} />
            <span className="text-xl font-black text-white tracking-tighter uppercase">SmartSchool</span>
          </div>
          <p className="text-white/30 text-xs font-bold tracking-[0.15em] uppercase">
            © {new Date().getFullYear()} SmartSchool. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
