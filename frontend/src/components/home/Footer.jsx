import { useState } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';
import ContactUsModal from './ContactUsModal';

export default function Footer() {
  const [openModal, setOpenModal] = useState(null); // 'privacy' | 'terms' | 'contact' | null

  const legalLinks = [
    { label: 'Privacy Policy', key: 'privacy' },
    { label: 'Terms of Service', key: 'terms' },
  ];
  const supportLinks = [{ label: 'Contact Us', key: 'contact' }];

  return (
    <>
      <footer className="bg-[#F3F6F1] w-full py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1280px] xl:max-w-[1600px] 2xl:max-w-[1800px] 3xl:max-w-[2400px] 4xl:max-w-[3000px] mx-auto px-4 sm:px-6 md:px-12 gap-12">
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
              {legalLinks.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setOpenModal(item.key)}
                  className="text-left text-xs sm:text-sm text-[#4B5A4D] hover:text-[#1B4332] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs font-bold text-[#14201A] uppercase mb-1 sm:mb-2 tracking-wider">
                Support
              </span>
              {supportLinks.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setOpenModal(item.key)}
                  className="text-left text-xs sm:text-sm text-[#4B5A4D] hover:text-[#1B4332] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <PrivacyPolicyModal open={openModal === 'privacy'} onClose={() => setOpenModal(null)} />
      <TermsOfServiceModal open={openModal === 'terms'} onClose={() => setOpenModal(null)} />
      <ContactUsModal open={openModal === 'contact'} onClose={() => setOpenModal(null)} />
    </>
  );
}