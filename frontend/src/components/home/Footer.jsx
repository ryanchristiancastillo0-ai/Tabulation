export default function Footer() {
  return (
    <footer className="bg-[#F3F6F1] w-full py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 gap-12">
        <div>
          <div
            className="text-lg sm:text-xl font-bold text-[#14201A] mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            USAL
          </div>
          <div className="text-xs sm:text-sm text-[#4B5A4D]">
            © {new Date().getFullYear()} USAL. All rights reserved.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-bold text-[#14201A] uppercase mb-1 sm:mb-2 tracking-wider">
              Legal
            </span>
            {['Privacy Policy', 'Terms of Service'].map((item) => (
              <a key={item} href="#" className="text-xs sm:text-sm text-[#4B5A4D] hover:text-[#1B4332] transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-bold text-[#14201A] uppercase mb-1 sm:mb-2 tracking-wider">
              Support
            </span>
            {['Contact Us'].map((item) => (
              <a key={item} href="#" className="text-xs sm:text-sm text-[#4B5A4D] hover:text-[#1B4332] transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}