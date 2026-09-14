export default function JudgeFooter({ sysConfig }) {
  const primary = sysConfig.primary_color || '#1B4332';

  return (
    <footer
      className="mt-6 border-t border-white/10"
      style={{ backgroundColor: primary }}
    >
      <div className="max-w-screen-xl 2xl:max-w-[1920px] 3xl:max-w-[2560px] mx-auto px-6 lg:px-10 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {sysConfig.portal_name || 'Veridict'}
            </h2>
            <p className="text-sm mt-1 text-white/70 max-w-md leading-relaxed">
              Professional judging and tabulation platform for Catholic schools
              and academic institutions in the Philippines.
            </p>
          </div>
        </div>
        <div className="w-full h-px bg-white/10 my-4" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-white/60 text-center md:text-left">
            © {new Date().getFullYear()}{' '}
            {sysConfig.school_name || 'Veridict'}.
            All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-white/60">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}