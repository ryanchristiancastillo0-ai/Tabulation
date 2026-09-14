import { ShieldCheck, Scale, ArrowRight, LogIn } from 'lucide-react';
import ModalShell from './ModalShell';

const roleOptions = [
  {
    key:      'admin',
    title:    'Sign In as Admin',
    desc:     'Manage your school, contestants, criteria, and live scores.',
    path:     '/login',
    icon:     ShieldCheck,
  },
  {
    key:      'judge',
    title:    'Sign In as Judge',
    desc:     'Score contestants in real time from the judging portal.',
    path:     '/judge/login',
    icon:     Scale,
  },
];

export default function SignInModal({ open, onClose, navigate }) {
  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to your USAL account"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => go(option.path)}
              className="group relative bg-white border border-[#E1E8DE] p-5 sm:p-6 rounded-sm cursor-pointer flex flex-col items-center text-center overflow-hidden transition-all duration-300 sm:hover:-translate-y-1 sm:hover:border-[#1B4332] sm:hover:shadow-[0px_10px_30px_rgba(27,67,50,0.10)]"
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1B4332]" />

              {/* Icon */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#F3F6F1] border border-[#1B4332]/15 rounded-sm flex items-center justify-center mb-4">
                <Icon size={22} className="text-[#1B4332]" />
              </div>

              {/* Title */}
              <h4
                className="text-[#14201A] font-semibold text-sm sm:text-base mb-1.5 leading-snug"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {option.title}
              </h4>

              {/* Description */}
              <p className="text-[#4B5A4D] text-xs leading-relaxed mb-5 max-w-[220px]">
                {option.desc}
              </p>

              {/* Continue */}
              <span
                className="mt-auto w-full flex items-center justify-between gap-2 px-3 py-2 rounded-sm border border-[#1B4332] text-[#1B4332] text-xs font-bold tracking-wide transition-colors group-hover:bg-[#1B4332] group-hover:text-white"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => go('/school')}
        className="w-full flex items-center justify-center gap-1.5 pt-4 mt-1 border-t border-[#E1E8DE] text-[#4B5A4D] hover:text-[#1B4332] transition-colors font-medium text-xs sm:text-sm"
      >
        Don&apos;t have a school account?
        <span className="font-bold text-[#1B4332]">Get Started</span>
      </button>
    </ModalShell>
  );
}