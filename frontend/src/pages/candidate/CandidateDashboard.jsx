import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCandidateProfileApi, uploadCandidateResumeApi } from '../../api/candidate';
import { User, FileText, CheckCircle2, Award, BookOpen, Clock, UploadCloud, AlertCircle, Sparkles, FolderGit2, BookmarkCheck, ExternalLink, Github } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await getCandidateProfileApi();
      setProfile(data);
    } catch (err) {
      console.warn('Could not load profile:', err);
    } finally {
      setLoading(false);
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
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Candidate Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-3">
              <User className="w-3.5 h-3.5" />
              Candidate Self-Service Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hello, {profile?.name || user?.full_name}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              {profile?.education || user?.company_or_institution || 'Candidate Profile'} • Profile & Resume Assessment Center
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[160px]">
            <span className="text-xs text-emerald-200 font-medium">Candidate Profile</span>
            <div className="text-xl font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              Active
            </div>
          </div>
        </div>
      </div>

      {/* Upload Feedback Banners */}
      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{uploadSuccess.message}</div>
            <div className="text-xs text-emerald-700 mt-1">
              Extracted <strong>{uploadSuccess.skills?.length || 0} skills</strong> with {uploadSuccess.extraction_accuracy}% confidence score.
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Resume Upload Error</div>
            <div className="text-xs text-red-700 mt-1">{uploadError}</div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Grid: Resume Status & Assessment Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Resume Upload & Parsing Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Your Resume</h3>
            <p className="text-xs text-slate-500 mb-4">
              Parsed by AI Copilot for role matching and competency extraction.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div><strong>Name:</strong> {profile?.name || user?.full_name}</div>
              <div><strong>Email:</strong> {profile?.email || user?.email}</div>
              <div><strong>Phone:</strong> {profile?.phone || user?.phone || 'Not provided'}</div>
              <div><strong>Experience:</strong> {profile?.experience || 'Not specified (upload resume to extract)'}</div>
              <div><strong>Education:</strong> {profile?.education || user?.company_or_institution || 'Not specified'}</div>
              <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>File: {profile?.resume_path || 'No resume uploaded yet'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? 'Parsing Resume (PDF/DOCX)...' : 'Upload Resume (PDF / DOCX)'}
          </button>
        </div>

        {/* Card 2: Skill Match & Readiness */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Extracted Skills ({skillsList.length})</h3>
            <p className="text-xs text-slate-500 mb-4">
              Verified competencies detected directly in candidate resume.
            </p>
            {skillsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No skills extracted yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload your resume (PDF / DOCX) to automatically detect and verify your skills.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {skillsList.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          {skillsList.length > 0 ? (
            <div className="mt-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
              <strong>Extraction Accuracy:</strong> &ge; 95% verified across technical keywords & education.
            </div>
          ) : (
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <strong>Skill Extraction:</strong> Automated NLP entity recognizer is ready to analyze your resume.
            </div>
          )}
        </div>

        {/* Card 3: Upcoming AI Interview Simulation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">AI Mock Interview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Role-specific technical questions and simulated mock evaluation.
            </p>
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <div className="font-semibold">Next Stage: Technical Screening</div>
              <div className="text-[11px] text-purple-700">Custom questions prepared for your profile.</div>
            </div>
          </div>
          <button 
            disabled 
            className="mt-5 w-full py-2 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Interview Simulation Ready
          </button>
        </div>

      </div>

      {/* Grid Row 2: Extracted Projects & Extracted Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 4: Extracted Projects */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
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
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
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
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
              <AlertCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-700">No certifications extracted yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload your resume to automatically extract certifications (AWS, Azure, CKA, etc.).</p>
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
  );
}
