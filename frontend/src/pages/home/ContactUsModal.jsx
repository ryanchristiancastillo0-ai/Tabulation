import { Mail } from 'lucide-react';
import ModalShell from './ModalShell';

export default function ContactUsModal({ open, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={Mail}
      title="Contact Us"
      subtitle="We usually respond within 1–2 business days"
    >
      <div className="flex flex-col items-center text-center py-4 space-y-4">
        <div className="p-3 rounded-sm bg-[#1B4332]/10 border border-[#1B4332]/15">
          <Mail size={28} className="text-[#1B4332]" />
        </div>
        <p className="text-sm text-[#4B5A4D] max-w-sm leading-relaxed">
          Have a question about setting up a competition, judge accounts, or scoring?
          Reach out to us and we'll get back to you as soon as we can.
        </p>
        <div className="w-full border border-[#1B4332]/15 bg-white px-4 py-3 rounded-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6C7A71] mb-1">
            Email
          </span>
          <span className="text-base font-bold text-[#1B4332] tracking-wide">
            stc.judging@gmail.com
          </span>
        </div>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2.5 rounded-sm text-xs font-bold text-white bg-[#1B4332] hover:bg-[#123024] transition-colors"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}