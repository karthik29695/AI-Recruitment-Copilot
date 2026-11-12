import React from 'react';
import { ShieldCheck, Briefcase, UserCheck } from 'lucide-react';

export default function RoleBadge({ role }) {
  if (role === 'hr') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
        HR Manager
      </span>
    );
  }
  if (role === 'recruiter') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
        Talent Recruiter
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
      Candidate
    </span>
  );
}
