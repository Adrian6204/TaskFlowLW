import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import { useAuth } from './auth/AuthContext';
import { isSupabaseConfigured } from './lib/supabaseClient';
import MainApp from './components/MainApp';

// Setup Required Screen Component
const SetupRequiredScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#111] p-4">
    <div className="max-w-md w-full bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl shadow-xl p-8 border border-slate-200 dark:border-white/10">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Setup Required</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Database connection missing.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-white/60 mb-2 font-medium">
            To connect the database, add these variables to Vercel:
          </p>
          <div className="font-mono text-xs text-slate-500 dark:text-white/40 bg-white dark:bg-black/50 p-3 rounded border border-slate-200 dark:border-white/10">
            SUPABASE_URL<br />
            SUPABASE_ANON_KEY
          </div>
        </div>

        <div className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
          After adding the variables, redeploy the project.
        </div>
      </div>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#111]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Single App for all authenticated users (role-based views handled inside MainApp)
const AppGateway: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" />;

  return <MainApp user={user} onLogout={logout} />;
};

// Main App Component with Routes
const App: React.FC = () => {
  // Check configuration first
  if (!isSupabaseConfigured) {
    return <SetupRequiredScreen />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />

      {/* Protected App Routes */}
      {/* Both /app and /app/* routes go to the Gatekeeper, which handles sub-routing */}
      <Route path="/app/*" element={
        <ProtectedRoute>
          <AppGateway />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};

export default App;


//Push hehe