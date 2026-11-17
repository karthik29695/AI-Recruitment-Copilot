import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getCandidateProfileApi, 
  uploadCandidateResumeApi,
  getCandidateJobsApi,
  applyToJobApi,
  getCandidateApplicationsApi
} from '../../api/candidate';
import { 
  User, 
  FileText, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Clock, 
  UploadCloud, 
  AlertCircle, 
  Sparkles, 
  FolderGit2, 
  BookmarkCheck, 
  ExternalLink, 
  Github,
  Briefcase,
  Search,
  Filter,
  Check,
  Send,
  Building,
  GraduationCap,
  Layers,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Tab State: 'dashboard' | 'browse_jobs' | 'applied_jobs'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Profile State
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Jobs State
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applyNotification, setApplyNotification] = useState(null);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    await Promise.all([
      loadProfile(),
      loadJobs(),
      loadApplications()
    ]);
  }

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const data = await getCandidateProfileApi();
      setProfile(data);
    } catch (err) {
      console.warn('Could not load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadJobs() {
    setLoadingJobs(true);
    try {
      const data = await getCandidateJobsApi();
      setJobs(data || []);
    } catch (err) {
      console.warn('Could not load jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function loadApplications() {
    setLoadingApplications(true);
    try {
      const data = await getCandidateApplicationsApi();
      setApplications(data || []);
    } catch (err) {
      console.warn('Could not load applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await uploadCandidateResumeApi(file);
      setUploadSuccess(res);
      await loadProfile();
      await loadJobs(); // Refresh match scores based on new skills
      await loadApplications();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleApply(jobId, jobTitle) {
    setApplyingJobId(jobId);
    setApplyNotification(null);

    try {
      const res = await applyToJobApi(jobId);
      setApplyNotification({
        type: 'success',
        message: `Successfully applied to ${jobTitle}! Your profile was evaluated at ${res.match_score}% match.`
      });
      // Refresh both jobs and applications
      await Promise.all([loadJobs(), loadApplications()]);
    } catch (err) {
      setApplyNotification({
        type: 'error',
        message: err.message || `Failed to apply to ${jobTitle}.`
      });
    } finally {
      setApplyingJobId(null);
    }
  }

  // Parse lists
  const skillsList = profile?.skills
    ? profile.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  let projectsList = [];
  if (profile?.projects) {
    if (Array.isArray(profile.projects)) {
      projectsList = profile.projects;
    } else if (typeof profile.projects === 'string') {
      try {
        const parsed = JSON.parse(profile.projects);
        if (Array.isArray(parsed)) {
          projectsList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          projectsList = [parsed];
        } else {
          projectsList = profile.projects.split(';').map(p => p.trim()).filter(Boolean);
        }
      } catch (e) {
        projectsList = profile.projects.split(';').map(p => p.trim()).filter(Boolean);
      }
    }
  }

  const certificationsList = profile?.certifications
    ? profile.certifications.split(';').map(c => c.trim()).filter(Boolean)
    : [];

  // Filter jobs
  const departments = ['All', ...new Set(jobs.map(j => j.department).filter(Boolean))];
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = 
      (j.job_title || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
      (j.required_skills || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
      (j.job_description || '').toLowerCase().includes(jobSearch.toLowerCase());
    const matchesDept = selectedDept === 'All' || j.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-3">
              <User className="w-3.5 h-3.5" />
              Candidate Career Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hello, {profile?.name || user?.full_name}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              {profile?.education || user?.company_or_institution || 'Engineering & Software Candidate'} • AI Profile, Requisition Exploration & ATS Submissions
            </p>
          </div>
          
          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-center min-w-[110px]">
              <span className="text-[11px] text-emerald-200 uppercase font-semibold">Active Jobs</span>
              <div className="text-xl font-bold text-white mt-0.5">{jobs.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-center min-w-[110px]">
              <span className="text-[11px] text-emerald-200 uppercase font-semibold">Jobs Applied</span>
              <div className="text-xl font-bold text-emerald-300 mt-0.5">{applications.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-center min-w-[110px]">
              <span className="text-[11px] text-emerald-200 uppercase font-semibold">Skills Verified</span>
              <div className="text-xl font-bold text-white mt-0.5">{skillsList.length}</div>
            </div>
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Dashboard & Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('browse_jobs')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'browse_jobs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Browse Jobs Posted</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'browse_jobs' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('applied_jobs')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'applied_jobs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Jobs Applied</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'applied_jobs' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {applications.length}
            </span>
          </button>
        </div>

        <span className="hidden md:inline-flex text-xs text-slate-400 font-medium px-3">
          AI-Assisted Candidate Workflow
        </span>
      </div>

      {/* Global Alerts / Notification */}
      {applyNotification && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-3 border transition-all ${
          applyNotification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {applyNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{applyNotification.message}</span>
          </div>
          <button 
            onClick={() => setApplyNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD & PROFILE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top Row: Resume Upload & Profile Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Resume Upload */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  {profile?.resume_path && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Resume Parsed
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">Upload Resume</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Upload your PDF or DOCX resume to auto-extract skills, education, projects, and certifications.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all rounded-xl p-6 text-center cursor-pointer mb-3"
                >
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {uploading ? 'Extracting Resume Insights...' : 'Click or Drop Resume here'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Supports PDF, DOCX (Target ≥ 95% Accuracy)
                  </span>
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{uploadSuccess.message}</div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">
                        Extraction confidence: {uploadSuccess.extraction_accuracy}% • {uploadSuccess.skills?.length || 0} skills indexed
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Active File:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                  {profile?.resume_path || 'No file uploaded'}
                </span>
              </div>
            </div>

            {/* Card 2: Extracted Candidate Profile Overview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Candidate Profile</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Structured representation extracted from your resume and account credentials.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-semibold text-slate-800">{profile?.name || user?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-semibold text-slate-800">{profile?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-semibold text-slate-800">{profile?.phone || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Experience</span>
                    <span className="font-semibold text-slate-800">{profile?.experience || 'Fresh Graduate / Student'}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-slate-500 block mb-1">Education</span>
                    <span className="font-medium text-slate-800 block text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {profile?.education || 'Degree not parsed yet'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Database Record</span>
                <span className="text-xs font-semibold text-blue-600">
                  Candidate ID #{profile?.candidate_id || user?.id}
                </span>
              </div>
            </div>

            {/* Card 3: Extracted Verified Skills */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {skillsList.length} Skills
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">Technical Skills</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Canonical skills mapped from your resume for intelligent job matching.
                </p>

                {skillsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                    Upload your resume to extract skills like Python, DSA, Machine Learning, Docker, SQL, etc.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {skillsList.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Matching Engine</span>
                <span className="text-emerald-600 font-semibold">Ontology Normalizer Active</span>
              </div>
            </div>

          </div>

          {/* Bottom Row: Extracted Projects & Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 4: Extracted Projects with Live Links */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Extracted Projects ({projectsList.length})</h3>
                    <p className="text-[11px] text-slate-500">Key technical initiatives and system implementations</p>
                  </div>
                </div>
              </div>

              {projectsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                  <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No projects extracted yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload your resume to automatically detect and index project highlights.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectsList.map((proj, idx) => {
                    const isObj = typeof proj === 'object' && proj !== null;
                    const title = isObj ? proj.title : proj;
                    const link = isObj ? proj.link : null;
                    const highlights = isObj ? (proj.highlights || (proj.description ? [proj.description] : [])) : [];
                    const description = isObj ? proj.description : '';

                    return (
                      <div key={idx} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs text-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>
                          </div>
                          {link && (
                            <a
                              href={link.startsWith('http') ? link : `https://${link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 text-[11px] font-semibold transition-colors flex-shrink-0 shadow-xs"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>Code / Demo</span>
                              <ExternalLink className="w-3 h-3 text-indigo-500" />
                            </a>
                          )}
                        </div>

                        {highlights.length > 0 ? (
                          <ul className="pl-7 space-y-1 text-slate-600 list-disc marker:text-indigo-400">
                            {highlights.map((h, hIdx) => (
                              <li key={hIdx} className="leading-relaxed">{h}</li>
                            ))}
                          </ul>
                        ) : description ? (
                          <p className="pl-7 text-slate-600 leading-relaxed">{description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 5: Extracted Certifications */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Certifications & Licenses ({certificationsList.length})</h3>
                    <p className="text-[11px] text-slate-500">Accredited vendor and industry certifications</p>
                  </div>
                </div>
              </div>

              {certificationsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                  <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No certifications extracted yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload your resume to automatically extract certifications (NPTEL, Oracle, Cisco, AWS, etc.).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {certificationsList.map((cert, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-center gap-2.5 font-medium">
                      <BookmarkCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BROWSE JOBS (JOBS POSTED)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'browse_jobs' && (
        <div className="space-y-6">
          
          {/* Search & Department Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job requisitions by role title, technical skill, or keyword..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedDept === dept
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Job Cards Grid */}
          {loadingJobs ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading available job opportunities...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Matching Jobs Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active requisitions match your filter. Check back soon or try clearing your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredJobs.map((job) => {
                const reqSkills = (job.required_skills || '').split(',').map(s => s.trim()).filter(Boolean);
                const isApplying = applyingJobId === job.job_id;

                return (
                  <div 
                    key={job.job_id} 
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {job.company && (
                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {job.company}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              {job.department || 'Engineering'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                            {job.job_title}
                          </h3>
                        </div>

                        {/* Match score badge (if computed or applied) */}
                        {job.match_score !== null && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Match Fit</span>
                            <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                              job.match_score >= 70 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : job.match_score >= 40 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {job.match_score}% Match
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Job Description */}
                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {job.job_description || 'High-impact technical role contributing to scalable applications and robust engineering systems.'}
                      </p>

                      {/* Experience and Skills */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Experience Required: <strong className="text-slate-700">{job.experience_required || 'Not specified'}</strong></span>
                        </div>

                        {reqSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reqSkills.slice(0, 5).map((skill, sIdx) => (
                              <span 
                                key={sIdx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {reqSkills.length > 5 && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] text-slate-400">
                                +{reqSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
                      </span>

                      {job.has_applied ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Applied ({job.application_status || 'Screened'})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(job.job_id, job.job_title)}
                          disabled={isApplying}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                        >
                          {isApplying ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Submitting Application...</span>
                            </>
                          ) : (
                            <>
                              <span>Apply Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JOBS APPLIED (MY APPLICATIONS)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'applied_jobs' && (
        <div className="space-y-6">
          
          {loadingApplications ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading your active applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Applications Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You haven't applied to any job requisitions yet. Browse our active openings to apply with your parsed profile!
              </p>
              <button
                onClick={() => setActiveTab('browse_jobs')}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore Opportunities</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {applications.map((app) => {
                const isSelected = selectedAppDetail?.match_id === app.match_id;

                return (
                  <div 
                    key={app.match_id} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* Header Strip */}
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {app.company && (
                            <span className="text-[11px] font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs">
                              {app.company}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {app.department || 'Engineering'}
                          </span>
                          <span className="text-xs text-slate-400">
                            Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {app.job_title}
                        </h3>
                      </div>

                      {/* Status and Score Badges */}
                      <div className="flex items-center gap-3">
                        <div className="text-center bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-medium">Match Fit</span>
                          <div className="text-base font-bold text-blue-600">{app.match_score}%</div>
                        </div>

                        <div className="text-center bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-medium">Hiring Score</span>
                          <div className="text-base font-bold text-emerald-600">{app.hiring_score}/100</div>
                        </div>

                        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          app.status === 'Shortlisted' || app.status === 'Offer Extended'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : app.status === 'Screened'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {app.status}
                        </div>
                      </div>
                    </div>

                    {/* Application Content Body */}
                    <div className="p-6 space-y-4">
                      {/* Skill Match Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Matched Profile Skills ({app.matched_skills.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.matched_skills.map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Skill Gap to Bridge ({app.missing_skills.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.missing_skills.length === 0 ? (
                              <span className="text-[11px] text-emerald-700 italic">Zero skill gaps detected!</span>
                            ) : (
                              app.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-200 text-[11px] font-medium">
                                  {s}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Learning Recommendation */}
                      {app.recommendation_notes && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-900 block mb-0.5">AI Learning Path Guidance:</strong>
                          {app.recommendation_notes}
                        </div>
                      )}

                      {/* AI Interview Questions for this application */}
                      {app.questions && app.questions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-purple-600" />
                              Custom AI Mock Interview Questions Prepared for You ({app.questions.length})
                            </h4>
                            <span className="text-[11px] text-slate-400">Technical Screening Simulation</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {app.questions.map((q, qIdx) => (
                              <div key={qIdx} className="p-3 bg-purple-50/40 rounded-xl border border-purple-100 text-xs text-purple-950 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-purple-700 font-semibold">
                                  <span>{q.category} • {q.difficulty_level}</span>
                                  <span>{q.response_time}</span>
                                </div>
                                <p className="font-medium text-slate-800 leading-snug">{q.question_text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
