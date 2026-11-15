import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Building2, CheckCircle2, TrendingUp, Briefcase, FileSpreadsheet } from 'lucide-react';

export default function HRDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              HR Leadership Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Organization: {user?.company_or_institution || 'Corporate Human Resources'} • Strategic Hiring & Talent Analytics
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[160px]">
            <span className="text-xs text-purple-200 font-medium">Platform Status</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Active
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount Requisitions</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">42</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">↑ 8 new this quarter</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Recruiters</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">12</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Across 4 departments</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening Accuracy</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">97%</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Exceeds 95% target</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Synchronization</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">Online</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Connected to candidate pool</span>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          Talent Acquisition & Workforce Overview
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          You are authenticated as an <strong>HR Manager</strong>. The AI Recruitment Copilot enables HR leaders to supervise automated resume ingestion, ensure standardized competency scoring, and configure job profile benchmarks across all enterprise teams.
        </p>
      </div>
    </div>
  );
}
