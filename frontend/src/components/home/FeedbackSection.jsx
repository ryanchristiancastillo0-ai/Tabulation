import { useState } from 'react';
import apiClient from '../../utils/apiClient';

export default function FeedbackSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
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
    <section className="py-16 sm:py-24 border-t border-[#e0e3e5] bg-[#f7f9fb]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12">
        <div className="max-w-2xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-3 py-1 bg-[#10b981]/10 text-[#006c49] text-xs font-semibold rounded-full mb-4 uppercase tracking-widest">
              We're Listening
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] mb-3 tracking-tight">
              Send Us Your Feedback
            </h2>
            <p className="text-sm sm:text-base text-[#3c4a42]">
              Spotted an issue or have a suggestion? Let us know and we'll get back to you.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-[#e0e3e5] rounded-xl p-6 sm:p-10 shadow-sm">

            {/* Success State */}
            {status === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-16 h-16 bg-[#10b981]/10 rounded-full flex items-center justify-center text-3xl">
                  ✅
                </div>
                <h3 className="text-xl font-semibold text-[#191c1e]">Message Sent!</h3>
                <p className="text-sm text-[#3c4a42]">
                  Thanks for reaching out. We'll review your feedback and respond if needed.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-sm font-semibold text-[#006c49] hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Maria Santos"
                    className="w-full border border-[#bbcabf] rounded-lg px-4 py-3 text-sm text-[#191c1e] placeholder-[#9eaaa4] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] transition-all bg-[#f7f9fb]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="e.g. maria@school.edu"
                    className="w-full border border-[#bbcabf] rounded-lg px-4 py-3 text-sm text-[#191c1e] placeholder-[#9eaaa4] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] transition-all bg-[#f7f9fb]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5 uppercase tracking-wide">
                    Message / Problem
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your feedback or issue in detail..."
                    className="w-full border border-[#bbcabf] rounded-lg px-4 py-3 text-sm text-[#191c1e] placeholder-[#9eaaa4] focus:outline-none focus:ring-2 focus:ring-[#10b981]/40 focus:border-[#10b981] transition-all bg-[#f7f9fb] resize-none"
                  />
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg px-4 py-3">
                    <span className="text-base leading-none mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#10b981] text-white py-3.5 rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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