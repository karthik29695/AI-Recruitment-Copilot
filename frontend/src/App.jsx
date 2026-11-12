import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import HRDashboard from './pages/hr/HRDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import { RefreshCw } from 'lucide-react';

function MainLayout() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading AI Recruitment Copilot...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AuthPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Quick Role Switch Bar for Evaluators / Demonstrations */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-medium text-slate-400">
            Current Portal View: <strong className="text-white uppercase">{user?.role}</strong> ({user?.full_name})
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 underline font-semibold transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Switch Role / Portal
          </button>
        </div>
      </div>

      <main className="flex-1">
        {user.role === 'hr' && <HRDashboard />}
        {user.role === 'recruiter' && <RecruiterDashboard />}
        {user.role === 'candidate' && <CandidateDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
