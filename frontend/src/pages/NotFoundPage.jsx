import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF7FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-brand-700 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 tracking-wider">
          Error 404
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested page <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">{window.location.pathname}</code> does not exist or has been moved.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-slate-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-purple-sm transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

