
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserIcon } from './icons/UserIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';

const HERO_SLIDES = [
  {
    icon: <SparklesIcon className="w-10 h-10 text-white" />,
    title: "AI-Powered Precision",
    content: "Automatically break down complex projects into manageable daily tasks.",
    accent: "bg-primary-500/80"
  },
  {
    icon: <ViewColumnsIcon className="w-10 h-10 text-white" />,
    title: "Visual Workflow",
    content: "Kanban and Calendar views designed for clarity and team alignment.",
    accent: "bg-primary-600/80"
  },
  {
    icon: <ClockIcon className="w-10 h-10 text-white" />,
    title: "Deep Analytics",
    content: "Track time and generate AI summaries of your team's weekly wins.",
    accent: "bg-primary-400/80"
  }
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on signup page based on URL
  const isLogin = location.pathname !== '/signup';
  const [activeSlide, setActiveSlide] = useState(0);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('AIE & Production');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, loading, login, signup } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  if (!loading && user) {
    // Redirect admins to overseer view, employees to home
    const defaultPath = user.isAdmin ? '/app/overseer' : '/app/home';
    const from = (location as any).state?.from?.pathname || defaultPath;
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
        // Navigate to app after successful login
        const from = (location as any).state?.from?.pathname || '/app/list';
        navigate(from, { replace: true });
      } else {
        await signup(username, password, fullName, department);
        navigate('/login');
      }
    } catch (err) {
      let message = err instanceof Error ? err.message : 'An unknown error occurred';
      // Clean up error message to hide 'email' since we use usernames
      message = message.replace(/email address/gi, 'username').replace(/email/gi, 'username');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setError(null);
    if (isLogin) {
      navigate('/signup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Side: Brand & Carousel */}
        <div className="hidden lg:flex flex-col justify-center space-y-12 p-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-900 dark:bg-white rounded-2xl shadow-xl">
              <SparklesIcon className="w-7 h-7 text-white dark:text-neutral-900" />
            </div>
            <span className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">TaskFlow</span>
          </div>

          <div className="relative h-[300px]">
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ease-out transform ${activeSlide === idx
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-8 scale-98 pointer-events-none'
                  }`}
              >
                <div className="inline-flex p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-8">
                  <div className="text-neutral-900 dark:text-white">{slide.icon}</div>
                </div>
                <h2 className="text-5xl font-bold text-neutral-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xl leading-relaxed max-w-md">
                  {slide.content}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1 rounded-full transition-all duration-500 ease-out ${activeSlide === idx ? 'w-12 bg-neutral-900 dark:bg-white' : 'w-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Clean Login Card */}
        <div className="flex justify-center animate-fade-in-up">
          <div className="w-full max-w-md bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-3xl p-10 lg:p-12 border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl shadow-neutral-900/5 dark:shadow-black/20">
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className="p-2 bg-neutral-900 dark:bg-white rounded-xl">
                <SparklesIcon className="w-5 h-5 text-white dark:text-neutral-900" />
              </div>
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">TaskFlow</span>
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-base">
                {isLogin ? 'Enter your credentials to continue.' : 'Start your journey with TaskFlow.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-neutral-900 dark:group-focus-within:text-white" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl py-3.5 pl-12 pr-4 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 transition-all duration-300"
                        placeholder="Jane Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1">Department</label>
                    <div className="relative group">
                      <ViewColumnsIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-neutral-900 dark:group-focus-within:text-white" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl py-3.5 pl-12 pr-4 text-neutral-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 transition-all duration-300"
                      >
                        <option value="AIE & Production">AIE & Production</option>
                        <option value="General">General</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1">Username</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-neutral-900 dark:group-focus-within:text-white" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl py-3.5 pl-12 pr-4 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 transition-all duration-300"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Password</label>
                </div>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 transition-colors group-focus-within:text-neutral-900 dark:group-focus-within:text-white" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl py-3.5 pl-12 pr-12 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold rounded-xl shadow-lg shadow-neutral-900/20 dark:shadow-white/10 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={toggleAuthMode}
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-400 dark:text-neutral-600 text-xs font-medium tracking-wide">
        TaskFlow
      </div>
    </div>
  );
};

export default LoginPage;
