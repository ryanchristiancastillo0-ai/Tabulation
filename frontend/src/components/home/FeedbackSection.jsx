import { useState } from 'react';
import apiClient from '../../utils/apiClient';

export default function FeedbackSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { name, email, message } = form;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in all fields before submitting.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      await apiClient.post('/feedback', { name, email, message });
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <section className="py-16 sm:py-24 border-t border-[#E1E8DE] bg-[#F3F6F1]">
      <div className="max-w-[1280px] xl:max-w-[1600px] 2xl:max-w-[1800px] 3xl:max-w-[2400px] 4xl:max-w-[3000px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="max-w-2xl xl:max-w-3xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="w-16 h-[2px] bg-[#1B4332] mx-auto mb-5" />
            <h2
              className="text-2xl sm:text-3xl font-semibold text-[#14201A] mb-3 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Send Us Your Feedback
            </h2>
            <p className="text-sm sm:text-base text-[#4B5A4D]">
              Spotted an issue or have a suggestion? Let us know and we'll get back to you.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-[#E1E8DE] rounded-sm p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1B4332]" />

            {/* Success State */}
            {status === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 bg-[#F3F6F1] border border-[#1B4332]/15 rounded-sm flex items-center justify-center text-3xl">
                  ✅
                </div>
                <h3
                  className="text-xl font-semibold text-[#14201A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Message Sent!
                </h3>
                <p className="text-sm text-[#4B5A4D]">
                  Thanks for reaching out. We'll review your feedback and respond if needed.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-sm font-semibold text-[#1B4332] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#14201A] mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Maria Santos"
                    className="w-full border border-[#BBCABB] rounded-sm px-4 py-3 text-sm text-[#14201A] placeholder-[#8FA192] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] transition-all bg-[#FBFCF9]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#14201A] mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. maria@school.edu"
                    className="w-full border border-[#BBCABB] rounded-sm px-4 py-3 text-sm text-[#14201A] placeholder-[#8FA192] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] transition-all bg-[#FBFCF9]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-[#14201A] mb-1.5 uppercase tracking-wide">
                    Message / Problem
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your feedback or issue in detail..."
                    className="w-full border border-[#BBCABB] rounded-sm px-4 py-3 text-sm text-[#14201A] placeholder-[#8FA192] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] transition-all bg-[#FBFCF9] resize-none"
                  />
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-sm px-4 py-3">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#1B4332] text-white py-3.5 rounded-sm text-sm font-bold hover:bg-[#123024] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Feedback
                      <span className="text-base leading-none">→</span>
                    </>
                  )}
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}