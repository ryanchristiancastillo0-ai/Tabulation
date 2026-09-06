import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// MODAL SHELL — shared theme wrapper (matches AdminLogin.jsx)
// ─────────────────────────────────────────────────────────
function ModalShell({ open, onClose, icon: Icon, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0B1710]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[#FBFCF9] rounded-sm border border-[#E1E8DE] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B4332] px-6 sm:px-8 py-6 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-10 h-[3px] bg-[#C9A227] mb-4" />
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-sm bg-white/10 border border-white/20">
                <Icon size={18} className="text-[#C9A227]" />
              </div>
            )}
            <div>
              <h3
                className="text-white text-lg sm:text-xl font-bold leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {title}
              </h3>
              {subtitle && (
                <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 text-sm text-[#4B5A4D] leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PRIVACY POLICY CONTENT
// ─────────────────────────────────────────────────────────
function PrivacyPolicyModal({ open, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={ShieldCheck}
      title="Privacy Policy"
      subtitle="Last updated: January 2025"
    >
      <p>
        USAL ("the Platform") is a judging and score tabulation system used to run competitions,
        pageants, and school events. This policy explains what information we collect from
        administrators, judges, and contestants, and how it is used.
      </p>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Information We Collect</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account details for administrators and judges (name, email, password hash, school/organization).</li>
          <li>Contestant records entered by administrators (name, number, category, photo if uploaded).</li>
          <li>Scores, rubric entries, and comments submitted by judges during live events.</li>
          <li>Basic device and usage data (IP address, browser type) for security and troubleshooting.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">How We Use It</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>To calculate and display live rankings, leaderboards, and final results.</li>
          <li>To let administrators monitor judge activity and scoring progress in real time.</li>
          <li>To power AI-assisted design suggestions used in generating score sheets and layouts.</li>
          <li>To send account notifications, password resets, and event updates.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Data Storage & Security</h4>
        <p>
          Scores and account data are stored in an encrypted database and are only accessible to
          the school/organization that created the event. Judge scores are locked once submitted
          and cannot be altered without administrator override, which is logged.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">Your Rights</h4>
        <p>
          Administrators may request export or deletion of their organization's data at any time
          by contacting support. Judges and contestants may request correction of their personal
          details through their event administrator.
        </p>
      </div>

      <p className="text-xs text-[#6C7A71] pt-2 border-t border-[#E1E8DE]">
        Questions about this policy can be sent to our support team via the Contact Us form.
      </p>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────
// TERMS OF SERVICE CONTENT
// ─────────────────────────────────────────────────────────
function TermsOfServiceModal({ open, onClose }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      icon={FileText}
      title="Terms of Service"
      subtitle="Last updated: January 2025"
    >
      <p>
        By creating a school/organization account or joining an event as a judge, you agree to the
        following terms governing use of the USAL scoring and tabulation platform.
      </p>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">1. Account Responsibility</h4>
        <p>
          Administrators are responsible for the accuracy of contestant data, judge assignments,
          and scoring configurations (weights, computation type, lock settings) entered into the
          system. USAL is not responsible for results affected by incorrect setup.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">2. Judge Conduct</h4>
        <p>
          Judges agree to submit scores independently and in good faith. Once an administrator
          locks scoring, judges may not submit or modify scores until the event is unlocked.
          Attempting to bypass scoring locks or manipulate submitted scores is prohibited.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">3. AI-Assisted Features</h4>
        <p>
          Certain design elements (score sheets, layouts, certificates) may be generated with
          AI assistance. These are provided as a convenience and administrators should review
          generated output before publishing it to judges or contestants.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">4. Availability</h4>
        <p>
          We aim for high uptime during live events but do not guarantee uninterrupted service.
          We recommend administrators keep a backup export of scores during large competitions.
        </p>
      </div>

      <div>
        <h4 className="font-bold text-[#14201A] text-sm mb-1.5">5. Termination</h4>
        <p>
          We reserve the right to suspend accounts found to be tampering with scores, impersonating
          judges, or otherwise abusing the platform outside its intended use as a judging tool.
        </p>
      </div>

      <p className="text-xs text-[#6C7A71] pt-2 border-t border-[#E1E8DE]">
        Continued use of USAL after changes to these terms constitutes acceptance of the revised terms.
      </p>
    </ModalShell>
  );
}


function ContactUsModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message.');
      }
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setError('');
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      icon={Mail}
      title="Contact Us"
      subtitle="We usually respond within 1–2 business days"
    >
      {sent ? (
        <div className="flex flex-col items-center text-center py-6">
          <CheckCircle2 size={36} className="text-[#1B4332] mb-3" />
          <div className="font-bold text-[#14201A] mb-1">Message Sent</div>
          <p className="text-xs text-[#6C7A71] max-w-xs">
            Thanks for reaching out — our support team has received your message and will get
            back to you at the email you provided.
          </p>
          <button
            onClick={handleClose}
            className="mt-5 px-5 py-2.5 rounded-sm text-xs font-bold text-white bg-[#1B4332] hover:bg-[#123024] transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs">
            Have a question about setting up a competition, judge accounts, or scoring? Send us a
            message below.
          </p>

          {error && (
            <div className="p-2.5 rounded-sm text-xs font-medium border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Juan Dela Cruz"
              className="w-full px-3.5 py-2.5 rounded-sm text-sm outline-none border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="juan@school.edu.ph"
              className="w-full px-3.5 py-2.5 rounded-sm text-sm outline-none border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={4}
              placeholder="Tell us what you need help with..."
              className="w-full px-3.5 py-2.5 rounded-sm text-sm outline-none border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-sm font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 bg-[#1B4332] hover:bg-[#123024]"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <span>Send Message</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      )}
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────
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