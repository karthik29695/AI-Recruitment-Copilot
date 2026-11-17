import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getHRAnalyticsApi, 
  getHRRequisitionsApi, 
  getHRCandidatesApi, 
  updateHRCandidateStatusApi 
} from '../../api/hr';
import { 
  Users, 
  Building2, 
  CheckCircle2, 
  TrendingUp, 
  Briefcase, 
  FileSpreadsheet,
  Award,
  Filter,
  Search,
  Check,
  X,
  Clock,
  ChevronRight,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

export default function HRDashboard() {
  const { user } = useAuth();

  // Tab State: 'dashboard' | 'requisitions' | 'approvals'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Requisitions State
  const [requisitions, setRequisitions] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqSearch, setReqSearch] = useState('');
  const [reqDeptFilter, setReqDeptFilter] = useState('All');

  // Candidates / Approvals State
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candSearch, setCandSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingMatchId, setUpdatingMatchId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    await Promise.all([
      loadAnalytics(),
      loadRequisitions(),
      loadCandidates()
    ]);
  }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      const data = await getHRAnalyticsApi();
      setAnalytics(data);
    } catch (err) {
      console.warn('Could not load HR analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function loadRequisitions() {
    setLoadingReqs(true);
    try {
      const data = await getHRRequisitionsApi();
      setRequisitions(data || []);
    } catch (err) {
      console.warn('Could not load HR requisitions:', err);
    } finally {
      setLoadingReqs(false);
    }
  }

  async function loadCandidates() {
    setLoadingCandidates(true);
    try {
      const data = await getHRCandidatesApi();
      setCandidates(data || []);
    } catch (err) {
      console.warn('Could not load HR candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function handleStatusUpdate(matchId, newStatus, candidateName) {
    setUpdatingMatchId(matchId);
    setNotification(null);

    try {
      await updateHRCandidateStatusApi(matchId, newStatus);
      setNotification({
        type: 'success',
        message: `Updated status for ${candidateName} to '${newStatus}' successfully!`
      });
      await loadCandidates();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || `Failed to update status for ${candidateName}.`
      });
    } finally {
      setUpdatingMatchId(null);
    }
  }

  // Filtered Requisitions
  const reqDepts = ['All', ...new Set(requisitions.map(r => r.department).filter(Boolean))];
  const filteredReqs = requisitions.filter(r => {
    const matchesSearch = 
      (r.job_title || '').toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.department || '').toLowerCase().includes(reqSearch.toLowerCase()) ||
      (r.required_skills || '').toLowerCase().includes(reqSearch.toLowerCase());
    const matchesDept = reqDeptFilter === 'All' || r.department === reqDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Filtered Candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(candSearch.toLowerCase()) ||
      (c.job_title || '').toLowerCase().includes(candSearch.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(candSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReqs = analytics?.total_requisitions ?? requisitions.length;
  const reqsSub = analytics?.requisitions_sub ?? 'Requisitions pipeline';
  const activeRecruiters = analytics?.active_recruiters ?? 0;
  const recruitersSub = analytics?.recruiters_sub ?? 'Recruiting team';
  const accuracy = analytics?.screening_accuracy ?? 'Ready';
  const accuracySub = analytics?.accuracy_sub ?? 'Resume parsing active';
  const atsStatus = analytics?.ats_status ?? 'Online';
  const atsSub = analytics?.ats_sub ?? 'Connected to system';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              HR Executive Operations Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Organization: {analytics?.organization || user?.company_or_institution || 'Corporate Human Resources'} • Strategic Workforce Governance & Candidate Approval Center
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[160px]">
            <span className="text-xs text-purple-200 font-medium">Platform Status</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Active
            </div>
            <span className="text-[11px] text-slate-300">ATS Synchronized</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Executive Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('requisitions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'requisitions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Requisitions</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'requisitions' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {requisitions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'approvals'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Approvals</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'approvals' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {candidates.length}
            </span>
          </button>
        </div>

        <span className="hidden md:inline-flex text-xs text-slate-400 font-medium px-3">
          HR Management & Governance
        </span>
      </div>

      {/* Global Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 border transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE DASHBOARD                                                */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount Requisitions</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Briefcase className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{loadingAnalytics ? '...' : totalReqs}</div>
              <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">{reqsSub}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Recruiters</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{loadingAnalytics ? '...' : activeRecruiters}</div>
              <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{recruitersSub}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening Accuracy</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{loadingAnalytics ? '...' : accuracy}</div>
              <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">{accuracySub}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Synchronization</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{loadingAnalytics ? '...' : atsStatus}</div>
              <span className="text-xs text-slate-500 font-medium mt-1 inline-block">{atsSub}</span>
            </div>
          </div>

          {/* Strategic Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Talent Acquisition & Strategic Workforce Overview
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              As an <strong>HR Manager</strong>, you oversee recruitment operations across departments. The AI Recruitment Copilot automatically normalizes candidate skillsets, flags competency gaps, and prepares role-specific interview guidelines so your talent acquisition team makes objective, data-backed hiring decisions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Requisition Oversight
                </div>
                <p className="text-purple-700">Track active positions and applicants across Engineering, AI, and Product.</p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  Standardized Scoring
                </div>
                <p className="text-blue-700">Audit compatibility match scores (≥85% accuracy target) and hiring indices.</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Approval Workflow
                </div>
                <p className="text-emerald-700">Approve top screened candidates or advance them directly to offer stage.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JOB REQUISITIONS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'requisitions' && (
        <div className="space-y-6">
          {/* Search & Department Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search requisitions by title, department, or required skills..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
              {reqDepts.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setReqDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    reqDeptFilter === dept
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Requisitions List */}
          {loadingReqs ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading organization requisitions...</p>
            </div>
          ) : filteredReqs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Requisitions Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active job requisitions currently match your filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredReqs.map((req) => {
                const skills = (req.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);

                return (
                  <div key={req.job_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {req.company && (
                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {req.company}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                              {req.department || 'Engineering'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                            {req.job_title}
                          </h3>
                        </div>

                        <div className="text-center bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
                          <span className="text-[10px] text-purple-600 font-bold block">APPLICANTS</span>
                          <span className="text-base font-extrabold text-purple-950">{req.applicants_count}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                        {req.job_description || 'Active organizational requisition managed by talent acquisition.'}
                      </p>

                      <div className="space-y-2">
                        <div className="text-xs text-slate-500">
                          Experience Requirement: <strong className="text-slate-700">{req.experience_required}</strong>
                        </div>

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {skills.slice(0, 5).map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Requisition #{req.job_id}</span>
                      <span>Created {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CANDIDATE APPROVALS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Search & Status Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or applied role..."
                value={candSearch}
                onChange={(e) => setCandSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
              {['All', 'Screened', 'Shortlisted', 'Offer Extended', 'Rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Table / Cards */}
          {loadingCandidates ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading candidate approval pool...</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Candidates Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No candidate applications currently match your filter criteria.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Applied Role & Dept</th>
                      <th className="py-3.5 px-4 text-center">Compatibility</th>
                      <th className="py-3.5 px-4 text-center">Hiring Score</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">HR Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((cand) => {
                      const isUpdating = updatingMatchId === cand.match_id;

                      return (
                        <tr key={cand.match_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{cand.name}</div>
                            <div className="text-slate-500 text-[11px]">{cand.email}</div>
                            {cand.education && (
                              <div className="text-slate-400 text-[10px] mt-0.5 truncate max-w-xs">{cand.education}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{cand.job_title}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {cand.company && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  {cand.company}
                                </span>
                              )}
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {cand.department}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {cand.match_score}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {cand.hiring_score}/100
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                              cand.status === 'Shortlisted' || cand.status === 'Offer Extended'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : cand.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {cand.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStatusUpdate(cand.match_id, 'Shortlisted', cand.name)}
                                disabled={isUpdating || cand.status === 'Shortlisted'}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 disabled:opacity-40 transition-colors"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(cand.match_id, 'Offer Extended', cand.name)}
                                disabled={isUpdating || cand.status === 'Offer Extended'}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] border border-purple-200 disabled:opacity-40 transition-colors"
                              >
                                Offer
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(cand.match_id, 'Rejected', cand.name)}
                                disabled={isUpdating || cand.status === 'Rejected'}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 disabled:opacity-40 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
