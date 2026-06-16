export default function Footer() {
  return (
    <footer className="bg-[#f2f4f6] w-full py-12 sm:py-16 border-t border-[#e0e3e5]">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 gap-12">
        <div>
          <div className="text-lg sm:text-xl font-bold text-[#191c1e] mb-4">
            Lumina Global Education
          </div>
          <p className="text-sm text-[#3c475a] max-w-sm leading-relaxed">
            Pioneering the future of institutional intelligence through secure, scalable, and intuitive software solutions.
          </p>
          <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-[#3c475a]">
            © {new Date().getFullYear()} Lumina Global Education. All rights reserved.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-bold text-[#191c1e] uppercase mb-1 sm:mb-2 tracking-wider">
              Legal
            </span>
            {['Privacy Policy', 'Terms of Service', 'Compliance'].map((item) => (
              <a key={item} href="#" className="text-xs sm:text-sm text-[#3c475a] hover:text-[#006c49] transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-bold text-[#191c1e] uppercase mb-1 sm:mb-2 tracking-wider">
              Support
            </span>
            {['Contact Us', 'Security Whitepaper', 'API Status'].map((item) => (
              <a key={item} href="#" className="text-xs sm:text-sm text-[#3c475a] hover:text-[#006c49] transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
