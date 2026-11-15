import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';

const ROLES = [
  {
    id: 'hr',
    title: 'HR Manager',
    subtitle: 'Workforce oversight & hiring decisions',
    icon: ShieldCheck,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    activeTabBg: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-500',
    demoEmail: 'hr@infosys.com',
    demoName: 'Deepika Sharma',
  },
  {
    id: 'recruiter',
    title: 'Talent Recruiter',
    subtitle: 'Resume parsing, matching & ranking',
    icon: Briefcase,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    activeTabBg: 'bg-blue-600 text-white',
    accentBorder: 'border-blue-500',
    demoEmail: 'recruiter@infosys.com',
    demoName: 'Arun Kumar',
  },
  {
    id: 'candidate',
    title: 'Job Candidate',
    subtitle: 'Application profiling & AI simulation',
    icon: UserCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeTabBg: 'bg-emerald-600 text-white',
    accentBorder: 'border-emerald-500',
    demoEmail: 'candidate@gmail.com',
    demoName: 'Sarah Johnson',
  },
];

export default function AuthPage() {
  const { login, register } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState('recruiter');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const activeRoleConfig = ROLES.find(r => r.id === selectedRole) || ROLES[1];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setEmail('');
    setPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleDemoFill = (roleObj) => {
    setSelectedRole(roleObj.id);
    setMode('login');
    setEmail(roleObj.demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({
          email,
          password,
          role: selectedRole,
        });
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        await register({
          email,
          password,
          full_name: fullName,
          role: selectedRole,
          company_or_institution: organization,
          phone,
        });
        setSuccessMsg('Account created successfully! Redirecting...');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Role-Based Access Portal
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Select your role to access the dedicated copilot interface: HR management, recruiter screening, or candidate self-service.
          </p>
        </div>

        {/* 3-Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSelect(role.id)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? `bg-white ${role.accentBorder} shadow-lg ring-2 ring-blue-500/20 border-2`
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? role.badgeColor : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base">{role.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{role.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-xl mx-auto">
          {/* Card Top Banner with Active Role */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <activeRoleConfig.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight">
                  {activeRoleConfig.title} {mode === 'login' ? 'Sign In' : 'Sign Up'}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedRole === 'hr' && 'Executive HR controls & organizational analytics'}
                  {selectedRole === 'recruiter' && 'Resume parsing, candidate scoring & job matching'}
                  {selectedRole === 'candidate' && 'Applicant profile, skill verification & mock test'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => { setMode('login'); setEmail(''); setPassword(''); setError(null); }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setEmail(''); setPassword(''); setError(null); }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  mode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Feedback Alerts */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={selectedRole === 'candidate' ? 'Sarah Johnson' : 'Arun Kumar'}
                      className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Organization / College & Phone (Sign Up only) */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {selectedRole === 'candidate' ? 'University / College / Previous Employer' : 'Company & Department'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder={selectedRole === 'candidate' ? 'IIT Madras / Infosys' : 'Infosys Ltd - Talent Acquisition'}
                        className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' ? `Sign In as ${activeRoleConfig.title}` : `Create ${activeRoleConfig.title} Account`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Fill Buttons (For Quick Evaluation & Review) */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Quick 1-Click Demo Logins:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleDemoFill(role)}
                    className="p-2 text-left rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-[11px]"
                  >
                    <div className="font-semibold text-slate-800">{role.title}</div>
                    <div className="text-slate-500 truncate">{role.demoEmail}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Pre-seeded test password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">Password123!</code>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
