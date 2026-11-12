import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  Users, 
  Search, 
  Filter, 
  ArrowUpRight,
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Resume Parsing & Candidate Profiling
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
              Milestone 1
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as Recruiter: <strong>{user?.full_name}</strong> ({user?.email}) • Upload and process resumes to generate structured candidate profiles
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Backend Connected
          </span>
        </div>
      </div>

      {/* Main Grid: Upload & Parsing Progress (Matching Slide 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Upload Resume Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                Upload Resume
              </h2>
              <span className="text-xs text-slate-400">PDF, DOCX supported</span>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop candidate resumes or click to browse
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Extraction target accuracy: &ge; 95%
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Upload Files
              </button>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sarah_Johnson_Resume.pdf</p>
                <p className="text-[11px] text-slate-500">Candidate Profile • 1.2 MB</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Ready for Parse
            </span>
          </div>
        </div>

        {/* Parsing Progress & Extracted Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Parsing Progress & Stats
              </h2>
              <span className="text-xs font-bold text-emerald-600">95% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full w-[95%]" />
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-3 gap-3 text-center mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500">Resumes</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">247</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500">Accuracy</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">97%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500">Profiles</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">235</p>
              </div>
            </div>

            {/* Extracted Card Snapshot */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Sample Extracted Information:
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
                <div><span className="font-semibold text-slate-800">Name:</span> Sarah Johnson</div>
                <div><span className="font-semibold text-slate-800">Email:</span> sarah@example.com</div>
                <div><span className="font-semibold text-slate-800">Experience:</span> 5 years</div>
                <div><span className="font-semibold text-slate-800">Education:</span> MS Computer Science</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Python', 'Machine Learning', 'Data Analysis', 'TensorFlow', 'SQL', 'FastAPI'].map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recently Processed Candidates Table */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Recently Processed Candidates
          </h3>
          <span className="text-xs text-slate-500">Milestone 1 Ingestion Database</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Candidate Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Experience</th>
                <th className="px-6 py-3 font-semibold">Key Skills</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60">
                <td className="px-6 py-3.5 font-bold text-slate-900">Sarah Johnson</td>
                <td className="px-6 py-3.5 text-slate-600">candidate@gmail.com</td>
                <td className="px-6 py-3.5 text-slate-600">5 years</td>
                <td className="px-6 py-3.5">
                  <div className="flex gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">Python</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">ML</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">SQL</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Processed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/60">
                <td className="px-6 py-3.5 font-bold text-slate-900">Michael Chen</td>
                <td className="px-6 py-3.5 text-slate-600">michael@example.com</td>
                <td className="px-6 py-3.5 text-slate-600">8 years</td>
                <td className="px-6 py-3.5">
                  <div className="flex gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">JavaScript</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">React</span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">Node.js</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Processed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
