
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { Logo } from './Logo';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { IdScannerView } from './IdScannerView';
import Background from './Background';
import InteractiveParticles from './InteractiveParticles';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname !== '/signup';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('AIE & Production');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const { user, loading, login, signup, logout } = useAuth(); // Ensure logout is destructured
  // Signup flow state
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Redirect if already logged in
  if (!loading && user && !isSigningUp && !successMessage) {
    const defaultPath = user.isAdmin ? '/app/overview' : '/app/home';
    let from = (location as any).state?.from?.pathname || defaultPath;

    const employeeOnlyViews = ['/app/home', '/app/board', '/app/list', '/app/calendar', '/app/gantt', '/app/timeline'];
    if (user.isAdmin && employeeOnlyViews.some(view => from.startsWith(view))) {
      from = '/app/overview';
    }

    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        setIsSigningUp(true);
        await signup(username, password, fullName, department);
        // Sign out immediately to prevent auto-login
        await logout();
        setSuccessMessage("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          setIsSigningUp(false);
          setSuccessMessage(null);
          setUsername('');
          setPassword('');
          setFullName('');
          setDepartment('AIE & Production');
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      let message = err instanceof Error ? err.message : 'An unknown error occurred';
      message = message.replace(/email address/gi, 'username').replace(/email/gi, 'username');
      setError(message);
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (name: string) => {
    const usernameFromScan = name.toLowerCase().replace(/\s+/g, '');
    setUsername(usernameFromScan);
    setPassword('test123');
    setIsAutoLoggingIn(true);

    setTimeout(async () => {
      setError(null);
      setIsLoading(true);
      try {
        await login(usernameFromScan, 'test123');
      } catch (err) {
        let message = err instanceof Error ? err.message : 'Login failed';
        setError(`${message} (Attempted login for ${name})`);
        setIsAutoLoggingIn(false);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const toggleAuthMode = () => {
    setError(null);
    setSuccessMessage(null);
    if (isLogin) {
      navigate('/signup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-500">
      <Background />
      <InteractiveParticles />

      {/* Theme Toggle Button */}
      <div className="absolute top-8 right-8 z-[100]">
        <button
          onClick={toggleTheme}
          className="p-3 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-xl"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </div>
      <InteractiveParticles />

      <div className="relative z-10 w-full max-w-7xl h-full lg:h-[85vh] grid grid-cols-1 lg:grid-cols-2 p-4 lg:p-8 gap-8 items-center">

        {/* Left Side: Cinematic Window Container with Ambient Glow Effect (Clean Shadow) */}
        <div className="hidden lg:block relative h-full w-full group animate-fade-in">
          <div className="relative h-full w-full rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(255,255,255,0.05)] border border-white/5">
            {/* Moving Background Effect as the content (Vivid Mode) */}
            {!isScannerOpen ? (
              <Background videoSrc="/background.mp4" className="absolute inset-0" noOverlays={true} />
            ) : (
              <IdScannerView onScan={handleScan} onCancel={() => setIsScannerOpen(false)} />
            )}

            {/* Logo overlay */}
            <div className="absolute top-10 left-10 flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                <Logo className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-white tracking-tight">Task Flow</span>
                <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">
                  AI
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Centered Content */}
        <div className="flex flex-col justify-center items-center lg:items-start animate-fade-in px-4 lg:px-12">
          <div className="w-full max-w-[440px] space-y-6">
            {/* Header Content */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-0">
                <div className="lg:hidden flex items-center gap-3">
                  <Logo className="w-10 h-10 text-slate-900 dark:text-white" />
                  <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Task Flow</span>
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-white/40 text-xs font-semibold tracking-wide">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={toggleAuthMode}
                    className="px-4 py-1.5 bg-transparent border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/40 rounded-xl text-slate-900 dark:text-white font-semibold text-xs transition-all"
                  >
                    {isLogin ? "Sign up" : "Log in"}
                  </button>
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] text-center lg:text-left">
                {isLogin ? "Sign In to Your Workspace" : "Create Your Account to Unleash Your Dreams"}
              </h1>
            </div>

            {/* Primary Entry: ID Scanner */}
            {isLogin && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="group relative w-full py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-[2rem] transition-all duration-500 flex items-center justify-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
                >
                  <div className="p-2 bg-white/10 dark:bg-black/5 rounded-xl">
                    <VideoCameraIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xl tracking-tight">Scan Identity Card</span>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 dark:bg-black/5 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <span className="text-xl">→</span>
                  </div>
                </button>

                {/* Decorative Separator */}
                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">or sign in with</span>
                  <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            )}

            {/* Form Section (Secondary) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="relative group">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300 cursor-pointer"
                    >
                      <option value="AIE & Production">AIE & Production</option>
                      <option value="Founder and CEO">Founder and CEO</option>
                      <option value="Managing Director">Managing Director</option>
                      <option value="Admin">Admin</option>
                      <option value="HR Assistant">HR Assistant</option>
                      <option value="Production Support">Production Support</option>
                      <option value="Admin and Research Assistant">Admin and Research Assistant</option>
                      <option value="AI Executive">AI Executive</option>
                      <option value="AIE Assistant">AIE Assistant</option>
                      <option value="Project Coordinator">Project Coordinator</option>
                      <option value="Admin Accounting">Admin Accounting</option>
                      <option value="IT Executive Assistant">IT Executive Assistant</option>
                      <option value="IT Assistant">IT Assistant</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </>
              )}

              <div className="relative group">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300"
                  placeholder="Username"
                />
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300"
                  placeholder="Password"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold animate-shake">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold animate-fade-in flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  {successMessage}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isAutoLoggingIn}
                  className="w-full py-3 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-2xl border border-black/5 dark:border-white/5 transition-all duration-300 flex items-center justify-center"
                >
                  {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-1 text-[10px] text-center lg:text-left uppercase tracking-widest text-slate-400 dark:text-white/20 font-bold leading-relaxed">
              <p>By signing in, you agree to TaskFlow's <a href="https://lifewood.com/terms-conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900 dark:hover:text-white transition-colors">Terms and Conditions</a></p>
              <p>and <a href="https://lifewood.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
