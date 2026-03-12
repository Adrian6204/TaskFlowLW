import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import Background from './Background';
import InteractiveParticles from './InteractiveParticles';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberMe') === 'true');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Load remembered username
  useEffect(() => {
    if (rememberMe) {
      const saved = localStorage.getItem('remembered_username');
      if (saved) setUsername(saved);
    }
  }, []);

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

  const { user, loading, login } = useAuth();

  // Always redirect to home after login — MainApp handles routing from there
  if (!loading && user) {
    return <Navigate to="/app/home" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('remembered_username');
        localStorage.setItem('rememberMe', 'false');
      }
      await login(username, password);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'An unknown error occurred';
      // Temporarily disabled masking to see exact Supabase error
      // message = message.replace(/email address/gi, 'username').replace(/email/gi, 'username');
      setError(message);
    } finally {
      setIsLoading(false);
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
            <Background videoSrc="/background.mp4" className="absolute inset-0" noOverlays={true} />

            {/* Logo overlay */}
            <div className="absolute top-10 left-10 flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                <Logo className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-white tracking-tight">Task Flow</span>
                  <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">
                    AI
                  </div>
                </div>
                <span className="text-[10px] font-medium text-white/50 tracking-wide">powered by Lifewood PH</span>
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
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Task Flow</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-white/50 tracking-wide">powered by Lifewood PH</span>
                  </div>
                </div>

              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] text-center lg:text-left">
                Sign In to Your Workspace
              </h1>
            </div>


            {/* Form Section (Secondary) */}
            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>

              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300"
                  placeholder="Password"
                  autoComplete="current-password"
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-slate-200 dark:border-white/10 rounded-lg group-hover:border-slate-300 dark:group-hover:border-white/20 transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white peer-checked:border-slate-900 dark:peer-checked:border-white" />
                    <svg className="absolute top-1 left-1 w-3 h-3 text-white dark:text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest group-hover:text-slate-700 dark:group-hover:text-white/50 transition-colors">Remember Me</span>
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold animate-shake">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold rounded-2xl border border-black/5 dark:border-white/5 transition-all duration-300 flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Sign In"}
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
