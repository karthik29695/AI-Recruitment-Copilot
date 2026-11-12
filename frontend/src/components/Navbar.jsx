import React from 'react';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { LogOut } from 'lucide-react';

export default function Navbar({ onSwitchRoleClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
            RC
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
              Recruitment Copilot
            </span>
            <p className="text-xs text-slate-500 leading-tight">
              AI-Powered Candidate Profiling & Screening
            </p>
          </div>
        </div>

        {/* User Status / Role / Logout */}
        {user ? (
          <div className="flex items-center gap-3">
            <RoleBadge role={user.role} />
            
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">{user.full_name}</span>
              <span className="text-[11px] text-slate-500">{user.email}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
