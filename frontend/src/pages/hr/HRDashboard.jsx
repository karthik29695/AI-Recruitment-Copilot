import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getHRAnalyticsApi } from '../../api/hr';
import { Users, Building2, CheckCircle2, TrendingUp, Briefcase, FileSpreadsheet } from 'lucide-react';

export default function HRDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const data = await getHRAnalyticsApi();
      setAnalytics(data);
    } catch (err) {
      console.warn('Could not load HR analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fallback if loading or error
  const totalReqs = analytics?.total_requisitions ?? 0;
  const reqsSub = analytics?.requisitions_sub ?? 'Requisitions pipeline';
  const activeRecruiters = analytics?.active_recruiters ?? 0;
  const recruitersSub = analytics?.recruiters_sub ?? 'Recruiting team';
  const accuracy = analytics?.screening_accuracy ?? 'Ready';
  const accuracySub = analytics?.accuracy_sub ?? 'Resume parsing active';
  const atsStatus = analytics?.ats_status ?? 'Online';
  const atsSub = analytics?.ats_sub ?? 'Connected to system';

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
              Organization: {analytics?.organization || user?.company_or_institution || 'Corporate Human Resources'} • Strategic Hiring & Talent Analytics
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
          <div className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : totalReqs}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">{reqsSub}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Recruiters</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : activeRecruiters}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{recruitersSub}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening Accuracy</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : accuracy}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">{accuracySub}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Synchronization</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : atsStatus}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{atsSub}</span>
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
