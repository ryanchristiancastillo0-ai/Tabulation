import {MapPin,Check,

} from 'lucide-react';
import {} from './index'
export default function SuccessScreen({ schoolName, adminName, fullAddress, navigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-14 max-w-md w-full text-center shadow-[0_8px_40px_rgba(0,108,73,0.08)]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <Check size={28} className="text-emerald-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">School registered!</h2>
        <p className="text-sm text-slate-600 mb-1 leading-relaxed">
          <strong>{schoolName}</strong> has been successfully created.
        </p>
        <p className="text-xs text-slate-400 mb-2 leading-relaxed">
          Admin account for <strong className="text-slate-600">{adminName}</strong> is ready.
        </p>
        {fullAddress && (
          <p className="text-xs text-slate-400 mb-8 leading-relaxed bg-slate-50 rounded-lg px-3.5 py-2 border border-slate-200 flex items-center justify-center gap-1.5">
            <MapPin size={11} />
            {fullAddress}
          </p>
        )}
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 rounded-xl border-none bg-emerald-400 hover:bg-emerald-600 text-white text-sm font-bold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-colors duration-150"
        >
          Go to Admin Login
        </button>
      </div>
    </div>
  );
}
