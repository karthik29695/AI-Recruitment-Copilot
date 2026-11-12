import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, FileText, CheckCircle2, Award, BookOpen, Clock, UploadCloud } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Candidate Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-3">
              <User className="w-3.5 h-3.5" />
              Candidate Self-Service Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Hello, {user?.full_name}
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              {user?.company_or_institution || 'B.Tech Computer Science Graduate'} • Profile & Resume Assessment Center
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-w-[160px]">
            <span className="text-xs text-emerald-200 font-medium">Candidate Profile</span>
            <div className="text-xl font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              Verified
            </div>
          </div>
        </div>
      </div>

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
              <div><strong>Name:</strong> {user?.full_name}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Phone:</strong> {user?.phone || '+91 98765 43212'}</div>
              <div><strong>Degree:</strong> {user?.company_or_institution || 'B.Tech in CS'}</div>
            </div>
          </div>
          <button className="mt-5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2">
            <UploadCloud className="w-4 h-4" />
            Upload Updated Resume (PDF/DOCX)
          </button>
        </div>

        {/* Card 2: Skill Match & Readiness */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Skills Profile</h3>
            <p className="text-xs text-slate-500 mb-4">
              Extracted skills detected in candidate resume.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Python', 'Data Structures', 'Machine Learning', 'FastAPI', 'React', 'SQL', 'Git'].map((skill) => (
                <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
            <strong>Copilot Tip:</strong> Adding cloud deployment (Docker, AWS) increases senior role matching by 28%.
          </div>
        </div>

        {/* Card 3: Upcoming AI Interview Simulation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">AI Mock Interview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Role-specific technical questions and simulated mock evaluation (Milestone 3 preview).
            </p>
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 space-y-1">
              <div className="font-semibold">Next Stage: Technical Screening</div>
              <div className="text-[11px] text-purple-700">3 custom questions prepared for your profile.</div>
            </div>
          </div>
          <button 
            disabled 
            className="mt-5 w-full py-2 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Available in Milestone 3
          </button>
        </div>

      </div>
    </div>
  );
}
