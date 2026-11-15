import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getJobsApi, 
  postJobApi, 
  getJobCandidatesApi, 
  getCandidateAnalysisApi, 
  regenerateQuestionsApi,
  uploadResumeApi,
  uploadJDApi
} from '../../api/recruiter';
import { 
  Briefcase, 
  PlusCircle, 
  Users, 
  FileText, 
  RefreshCw, 
  GraduationCap, 
  Clock, 
  Award, 
  HelpCircle, 
  BookOpen, 
  X, 
  Check, 
  AlertCircle,
  ChevronRight,
  UploadCloud,
  Sparkles,
  FileUp,
  CheckCircle2,
  FolderGit2,
  BookmarkCheck,
  ExternalLink,
  Github
} from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const resumeInputRef = useRef(null);
  const jdFileInputRef = useRef(null);

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Candidates list for selected job
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // In-depth candidate evaluation (Skill gaps + Interview Questions)
  const [candidateAnalysis, setCandidateAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [regeneratingQuestions, setRegeneratingQuestions] = useState(false);

  // Resume upload state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadResult, setResumeUploadResult] = useState(null);
  const [resumeUploadError, setResumeUploadError] = useState(null);

  // Modal for posting / uploading a Job Description
  const [showPostModal, setShowPostModal] = useState(false);
  const [jdMode, setJdMode] = useState('text'); // 'text' or 'file'
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [newJobExp, setNewJobExp] = useState('3+ years');
  const [newJobSkills, setNewJobSkills] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [selectedJdFile, setSelectedJdFile] = useState(null);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [postError, setPostError] = useState(null);

  // Load jobs on initial render
  useEffect(() => {
    loadJobs();
  }, []);

  // When selectedJobId changes, load its candidate rankings
  useEffect(() => {
    if (selectedJobId) {
      loadCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  // When selectedCandidateId changes, load detailed analysis
  useEffect(() => {
    if (selectedJobId && selectedCandidateId) {
      loadAnalysis(selectedJobId, selectedCandidateId);
    }
  }, [selectedJobId, selectedCandidateId]);

  async function loadJobs() {
    setLoadingJobs(true);
    try {
      const data = await getJobsApi();
      setJobs(data);
      if (data.length > 0 && !selectedJobId) {
        setSelectedJobId(data[0].job_id);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  }

  async function loadCandidatesForJob(jobId) {
    setLoadingCandidates(true);
    try {
      const data = await getJobCandidatesApi(jobId);
      setCandidates(data);
      if (data.length > 0) {
        setSelectedCandidateId(data[0].candidate_id);
      } else {
        setSelectedCandidateId(null);
        setCandidateAnalysis(null);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function loadAnalysis(jobId, candId) {
    setLoadingAnalysis(true);
    try {
      const data = await getCandidateAnalysisApi(jobId, candId);
      setCandidateAnalysis(data);
    } catch (err) {
      console.error('Failed to load candidate analysis:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function handleRegenerateQuestions() {
    if (!selectedJobId || !selectedCandidateId) return;
    setRegeneratingQuestions(true);
    try {
      const newQs = await regenerateQuestionsApi(selectedJobId, selectedCandidateId);
      setCandidateAnalysis(prev => prev ? { ...prev, questions: newQs } : prev);
    } catch (err) {
      console.error('Failed to regenerate questions:', err);
    } finally {
      setRegeneratingQuestions(false);
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    setResumeUploadResult(null);
    setResumeUploadError(null);

    try {
      const res = await uploadResumeApi(file);
      setResumeUploadResult(res);

      // Refresh candidate list for the currently active job
      if (selectedJobId) {
        await loadCandidatesForJob(selectedJobId);
      }
    } catch (err) {
      setResumeUploadError(err.message || 'Failed to parse resume document.');
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    setSubmittingJob(true);
    setPostError(null);

    try {
      if (jdMode === 'file') {
        if (!selectedJdFile) {
          throw new Error('Please select a Job Description document (.pdf, .docx, .txt).');
        }
        const created = await uploadJDApi({ file: selectedJdFile });
        const refreshedJobs = await getJobsApi();
        setJobs(refreshedJobs);
        setSelectedJobId(created.job_id);
      } else {
        if (!newJobTitle.trim() || !newJobSkills.trim()) {
          throw new Error('Please provide Job Title and Required Skills.');
        }
        const created = await postJobApi({
          job_title: newJobTitle,
          department: newJobDept,
          experience_required: newJobExp,
          required_skills: newJobSkills,
          job_description: newJobDesc
        });
        const refreshedJobs = await getJobsApi();
        setJobs(refreshedJobs);
        setSelectedJobId(created.job_id);
      }

      // Reset modal state
      setNewJobTitle('');
      setNewJobSkills('');
      setNewJobDesc('');
      setSelectedJdFile(null);
      setShowPostModal(false);
    } catch (err) {
      setPostError(err.message || 'Failed to process Job Description');
    } finally {
      setSubmittingJob(false);
    }
  }

  const activeJob = jobs.find(j => j.job_id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hidden file input for recruiter resume uploads */}
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleResumeUpload}
        className="hidden"
      />

      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recruiter Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong>{user?.full_name}</strong> • AI resume parsing, job description analysis, compatibility rankings & skill gaps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ingest Candidate Resume (PDF / DOCX) */}
          <button
            onClick={() => resumeInputRef.current?.click()}
            disabled={uploadingResume}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            {uploadingResume ? 'Parsing Resume (PDF/DOCX)...' : 'Upload Candidate Resume'}
          </button>

          {/* Upload / Post Job Description */}
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Post / Upload Job Description
          </button>
        </div>
      </div>

      {/* Resume Ingestion Feedback Banner */}
      {resumeUploadResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                Resume Parsed Successfully: {resumeUploadResult.name}
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                {resumeUploadResult.email} • {resumeUploadResult.phone} • {resumeUploadResult.education} • {resumeUploadResult.experience}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-950">Extracted Skills:</span>
                {resumeUploadResult.skills?.slice(0, 8).map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-[11px] font-medium text-emerald-900">
                    {s}
                  </span>
                ))}
                {resumeUploadResult.skills?.length > 8 && (
                  <span className="text-[11px] text-emerald-700">+{resumeUploadResult.skills.length - 8} more</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              {resumeUploadResult.extraction_accuracy}% Accuracy
            </span>
          </div>
        </div>
      )}

      {resumeUploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span><strong>Resume Parsing Error:</strong> {resumeUploadError}</span>
          </div>
          <button onClick={() => setResumeUploadError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Job Selector Navigation Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Active Job Requisitions ({jobs.length})
          </span>
          <span className="text-xs text-slate-400">Select a role to inspect evaluated applicants</span>
        </div>

        {loadingJobs ? (
          <div className="py-4 text-center text-xs text-slate-500">Loading requisitions...</div>
        ) : jobs.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-sm">
            No jobs posted yet. Click <strong>Post / Upload Job Description</strong> to start.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {jobs.map((job) => {
              const isActive = job.job_id === selectedJobId;
              return (
                <button
                  key={job.job_id}
                  onClick={() => setSelectedJobId(job.job_id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left border transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/10 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{job.job_title}</div>
                    <div className="text-[11px] text-slate-500">
                      {job.department} • {job.applicants_count} applicants
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* When no jobs exist yet for this recruiter account, display clean empty state */}
      {!loadingJobs && jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No Job Descriptions Posted Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto mb-6">
            Your workspace is clean and ready. Upload a Job Description document (PDF/DOCX) or paste role requirements to automatically extract skills, establish benchmark criteria, and rank candidates.
          </p>
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Post / Upload First Job Description
          </button>
        </div>
      ) : (
        <>
          {/* 3. Selected Job Snapshot Banner */}
          {activeJob && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                    {activeJob.department}
                  </span>
                  <span className="text-xs text-slate-400">Experience Required: {activeJob.experience_required}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">{activeJob.job_title}</h2>
                <p className="text-xs text-slate-300 max-w-3xl line-clamp-2 mt-1">
                  {activeJob.job_description || 'No detailed description provided.'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Required Skills:</span>
                  {activeJob.required_skills?.split(',').map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[11px]">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[140px] flex-shrink-0">
                <span className="text-xs text-slate-300">Total Ingested</span>
                <div className="text-2xl font-bold text-white mt-0.5">
                  {candidates.length}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Ranked & Evaluated</span>
              </div>
            </div>
          )}

          {/* 4. Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (5 Cols): Candidate Rankings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Candidate Rankings ({candidates.length})
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by Match Score</span>
                </div>

                {loadingCandidates ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Calculating semantic matches...
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs px-4 space-y-2">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700">No candidates evaluated yet for this role</p>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>Upload Candidate Resume</strong> above to ingest a candidate resume (PDF/DOCX) and run automated matching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((cand, index) => {
                      const isSelected = cand.candidate_id === selectedCandidateId;
                      
                      let scoreBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      if (cand.match_score < 70 && cand.match_score >= 50) {
                        scoreBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                      } else if (cand.match_score < 50) {
                        scoreBadgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                      }

                      return (
                        <div
                          key={cand.candidate_id}
                          onClick={() => setSelectedCandidateId(cand.candidate_id)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                              : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                                #{index + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm leading-tight">{cand.name}</h4>
                                <p className="text-xs text-slate-500">{cand.email}</p>
                              </div>
                            </div>

                            {/* Match Score Badge */}
                            <div className="text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreBadgeColor}`}>
                                {cand.match_score}% Match
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Score: {cand.hiring_score}/100
                              </div>
                            </div>
                          </div>

                          {/* Candidate Details & Key Skills */}
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                            <span>Exp: <strong>{cand.experience || 'N/A'}</strong></span>
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span className="truncate max-w-[140px] text-[11px] font-medium text-slate-700">
                                {cand.resume_path || 'Resume.pdf'}
                              </span>
                            </div>
                          </div>

                          {/* Skills Chips */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {cand.key_skills?.map((skill, sIdx) => (
                              <span key={sIdx} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700">
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* Status & Recommendation */}
                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">
                              Rec: <strong className="text-slate-800">{cand.recommendation}</strong>
                            </span>
                            <span className="text-blue-600 font-semibold inline-flex items-center gap-0.5">
                              View Analysis <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (7 Cols): Deep Review: Skill Gaps & Interview Questions */}
            <div className="lg:col-span-7 space-y-6">
              
              {loadingAnalysis ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-xs text-slate-500">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading candidate evaluation dossier & questions...
                </div>
              ) : !candidateAnalysis ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500 text-sm">
                  Select a candidate from the left panel to review skill gaps and generated interview questions.
                </div>
              ) : (
                <>
                  {/* A. Candidate Profile Dossier Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{candidateAnalysis.candidate.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {candidateAnalysis.recommendation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {candidateAnalysis.candidate.email} • {candidateAnalysis.candidate.phone || 'Phone not provided'}
                        </p>
                      </div>

                      {/* Resume Attached Tag */}
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-800">
                          {candidateAnalysis.candidate.resume_path || 'Resume.pdf'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500">Compatibility</span>
                        <div className="text-lg font-bold text-blue-600 mt-0.5">{candidateAnalysis.match_score}%</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500">Hiring Score</span>
                        <div className="text-lg font-bold text-emerald-600 mt-0.5">{candidateAnalysis.hiring_score}/100</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500">Experience</span>
                        <div className="text-lg font-bold text-slate-800 mt-0.5">{candidateAnalysis.candidate.experience || 'N/A'}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500">Application</span>
                        <div className="text-lg font-bold text-purple-600 mt-0.5">{candidateAnalysis.status}</div>
                      </div>
                    </div>

                    {candidateAnalysis.candidate.education && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60">
                        <GraduationCap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>Education: <strong>{candidateAnalysis.candidate.education}</strong></span>
                      </div>
                    )}

                    {candidateAnalysis.candidate.certifications && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
                        <BookmarkCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[11px] text-amber-950 uppercase tracking-wider mb-1">Accredited Certifications:</strong>
                          <div className="flex flex-wrap gap-1.5">
                            {candidateAnalysis.candidate.certifications.split(';').map((c, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-medium">
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {candidateAnalysis.candidate.projects && (() => {
                      let projs = [];
                      try {
                        const parsed = JSON.parse(candidateAnalysis.candidate.projects);
                        projs = Array.isArray(parsed) ? parsed : [parsed];
                      } catch {
                        projs = candidateAnalysis.candidate.projects.split(';').map(p => ({ title: p.trim(), link: null, highlights: [] }));
                      }

                      return (
                        <div className="mt-3 text-xs text-indigo-900 bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/60 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Key Portfolio Projects ({projs.length}):</span>
                          </div>
                          <div className="space-y-2">
                            {projs.map((p, pIdx) => {
                              const isObj = typeof p === 'object' && p !== null;
                              const title = isObj ? p.title : p;
                              const link = isObj ? p.link : null;
                              const highlights = isObj ? (p.highlights || (p.description ? [p.description] : [])) : [];

                              return (
                                <div key={pIdx} className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 text-[11px] space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-bold text-slate-900">{title}</span>
                                    {link && (
                                      <a
                                        href={link.startsWith('http') ? link : `https://${link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 font-semibold transition-colors flex-shrink-0"
                                      >
                                        <Github className="w-3 h-3" />
                                        <span>Demo / Repo</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                  {highlights.length > 0 && (
                                    <ul className="pl-4 space-y-0.5 text-slate-600 list-disc">
                                      {highlights.slice(0, 3).map((h, hIdx) => (
                                        <li key={hIdx} className="leading-relaxed">{h}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* B. Skill Gap Analysis Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Skill Gap Analysis
                      </h3>
                      <span className="text-xs text-slate-400">Target Role: {candidateAnalysis.job_title}</span>
                    </div>

                    {/* Matched vs Missing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Matched Required Skills ({candidateAnalysis.matched_skills.length})
                        </span>
                        {candidateAnalysis.matched_skills.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No direct required skill matches.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {candidateAnalysis.matched_skills.map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-md text-xs font-semibold shadow-xs">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/70">
                        <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Missing Competencies ({candidateAnalysis.missing_skills.length})
                        </span>
                        {candidateAnalysis.missing_skills.length === 0 ? (
                          <p className="text-xs text-emerald-700 font-semibold">100% Skill Coverage! No gaps identified.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {candidateAnalysis.missing_skills.map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-md text-xs font-semibold shadow-xs">
                                <X className="w-3 h-3 text-rose-500" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Upskilling Recommendations */}
                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        AI Upskilling Recommendations:
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {candidateAnalysis.recommendation_notes}
                      </p>
                      {candidateAnalysis.recommended_courses?.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {candidateAnalysis.recommended_courses.map((course, cIdx) => (
                            <span key={cIdx} className="px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-800 text-[11px] font-medium">
                              📚 {course}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* C. Role-Specific Interview Questions Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-600" />
                          Role-Specific Interview Questions
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tailored to {candidateAnalysis.job_title} and candidate's competency gaps
                        </p>
                      </div>

                      <button
                        onClick={handleRegenerateQuestions}
                        disabled={regeneratingQuestions}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingQuestions ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-3">
                      {candidateAnalysis.questions?.map((q, qIdx) => (
                        <div key={qIdx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                                {q.question_text}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-semibold border border-indigo-200">
                                  {q.category}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">
                                  Difficulty: {q.difficulty_level}
                                </span>
                                <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto">
                                  <Clock className="w-3 h-3" />
                                  {q.response_time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </>
      )}

      {/* 5. Modal for Uploading / Posting Job Description */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Post / Upload Job Description</h3>
                  <p className="text-xs text-slate-500">Auto-extracts skills & ranks all candidate profiles upon creation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs: Upload Document vs Manual Form */}
            <div className="mt-4 flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setJdMode('text')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  jdMode === 'text' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Structured Form / Paste Text
              </button>
              <button
                type="button"
                onClick={() => setJdMode('file')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  jdMode === 'file' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload JD Document (PDF / DOCX)
              </button>
            </div>

            {postError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {postError}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
              
              {jdMode === 'file' ? (
                /* File Upload Dropzone */
                <div className="space-y-4">
                  <div 
                    onClick={() => jdFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50/30 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedJdFile ? selectedJdFile.name : 'Click to select or drag & drop Job Description document'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: PDF, DOCX, TXT
                    </p>
                    <input
                      ref={jdFileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => setSelectedJdFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    The JD Analyzer will automatically extract the <strong>Job Title</strong>, <strong>Required Competencies</strong>, <strong>Experience Thresholds</strong>, and <strong>Education Criteria</strong>.
                  </p>
                </div>
              ) : (
                /* Manual Inputs */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Machine Learning Engineer, Cloud Architect"
                      value={newJobTitle}
                      onChange={(e) => setNewJobTitle(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="Engineering / Data Science"
                        value={newJobDept}
                        onChange={(e) => setNewJobDept(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Experience Required
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 3+ years, 5 years"
                        value={newJobExp}
                        onChange={(e) => setNewJobExp(e.target.value)}
                        className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Required Competencies & Skills <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Python, PyTorch, Kubernetes, MLOps, SQL, Docker (comma separated)"
                      value={newJobSkills}
                      onChange={(e) => setNewJobSkills(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      The candidate matching engine will automatically compute skill coverage against these tags.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job Description / Role Responsibilities
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Paste or write the role responsibilities, deliverables, and team context..."
                      value={newJobDesc}
                      onChange={(e) => setNewJobDesc(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingJob ? 'Processing & Ranking...' : 'Publish Job & Rank Candidates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
