import { MapPin, Check, ChevronRight } from 'lucide-react';
import {} from './index'
export default function SuccessScreen({ schoolName, adminName, fullAddress, navigate }) {
  return (
    <div className="min-h-screen bg-[#FBFCF9] font-['Inter',sans-serif] flex items-center justify-center px-5">
      <div className="relative bg-white rounded-sm border border-[#E1E8DE] p-8 sm:p-14 max-w-md w-full text-center shadow-[0_8px_40px_rgba(27,67,50,0.08)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1B4332]" />
        <div className="w-16 h-16 rounded-full bg-[#F3F6F1] flex items-center justify-center mx-auto mb-6 border border-[#BBCABB]">
          <Check size={28} className="text-[#1B4332]" />
        </div>
        <div className="w-12 h-[2px] bg-[#C9A227] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#14201A] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>School registered!</h2>
        <p className="text-sm text-[#4B5A4D] mb-1 leading-relaxed">
          <strong className="text-[#1B4332]">{schoolName}</strong> has been successfully created.
        </p>
        <p className="text-xs text-[#6C7A71] mb-2 leading-relaxed">
          Admin account for <strong className="text-[#4B5A4D]">{adminName}</strong> is ready.
        </p>
        {fullAddress && (
          <p className="text-xs text-[#6C7A71] mb-8 leading-relaxed bg-[#F3F6F1] rounded-sm px-3.5 py-2 border border-[#E1E8DE] flex items-center justify-center gap-1.5">
            <MapPin size={11} className="text-[#C9A227]" />
            {fullAddress}
          </p>
        )}
        <button
          onClick={() => navigate('/login')}
          style={{ fontFamily: "'Inter', sans-serif" }}
          className="w-full py-3 rounded-sm border-none bg-[#1B4332] hover:bg-[#123024] text-white text-sm font-bold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(27,67,50,0.3)] transition-colors duration-150 inline-flex items-center justify-center gap-2"
        >
          Go to Admin Login <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
