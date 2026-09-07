import { useState } from 'react';
import { Building2, Mail, Phone, Upload, Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { Field, AddressSection, inputCls, StrengthBar } from './index';
import { SCHOOL_PRESETS } from '../../constant/schoolPresets';

export default function SchoolInfoSection({ form, setField, errors, setErrors, logoRef, handleLogo, loc }) {
  const [showJudgePw, setShowJudgePw] = useState(false);

  const [schoolChoice, setSchoolChoice] = useState(() => {
    if (!form.school_name) return '';
    const match = SCHOOL_PRESETS.find((s) => s.name === form.school_name);
    return match ? match.cityCode : 'other';
  });

  function handleSchoolChoice(e) {
    const val = e.target.value;
    setSchoolChoice(val);
    setErrors((prev) => ({ ...prev, school_name: '' }));
    if (val === '' || val === 'other') {
      setField('school_name', '');
    } else {
      const preset = SCHOOL_PRESETS.find((s) => s.cityCode === val);
      if (preset) {
        setField('school_name', preset.name);
        loc.applyPresetLocality(preset.cityCode);
      }
    }
  }

  return (
    <div className="px-4 sm:px-9 py-6 sm:py-8 border-b border-[#E1E8DE]">
      <div
        className="text-sm font-bold text-[#1B4332] mb-5 sm:mb-6 flex items-center gap-2"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        <Building2 size={14} /> School Information
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">

        {/* Logo Upload */}
        <Field label="School Logo">
          <div
            onClick={() => logoRef.current.click()}
            className={[
              'border-2 border-dashed rounded-sm p-3 sm:p-4 cursor-pointer flex items-center gap-3 transition-all duration-200',
              form.school_logo
                ? 'border-[#1B4332] bg-[#F3F6F1]'
                : 'border-[#BBCABB] bg-[#FBFCF9] hover:border-[#1B4332]',
            ].join(' ')}
          >
            {form.school_logo ? (
              <>
                <img src={form.school_logo} alt="logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm object-cover shrink-0" />
                <div>
                  <div className="text-sm font-bold text-[#1B4332]">Logo uploaded</div>
                  <div className="text-xs text-[#4B5A4D]">Click to replace</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm bg-[#F3F6F1] flex items-center justify-center border border-[#E1E8DE] shrink-0">
                  <Upload size={18} className="text-[#6C7A71]" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#4B5A4D]">Click to upload logo</div>
                  <div className="text-[10px] sm:text-xs text-[#8FA192]">PNG, JPG, SVG — recommended 300×300px</div>
                </div>
              </>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </Field>

        {/* School Name */}
        <Field label="School Name *" icon={Building2} error={errors.school_name}>
          <div className="relative">
            <select
              value={schoolChoice}
              onChange={handleSchoolChoice}
              className={[
                inputCls(errors.school_name),
                'appearance-none pr-9 cursor-pointer',
                !schoolChoice ? 'text-slate-400' : 'text-slate-900',
              ].join(' ')}
            >
              <option value="">Select a school or type your own…</option>
              {SCHOOL_PRESETS.map((s) => (
                <option key={s.cityCode} value={s.cityCode}>{s.name}</option>
              ))}
              <option value="other">Other — Type your school name</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
              <ChevronDown size={14} />
            </div>
          </div>
          {schoolChoice === 'other' && (
            <input
              className={`${inputCls(errors.school_name)} mt-2`}
              placeholder="Type your school name"
              value={form.school_name}
              onChange={(e) => setField('school_name', e.target.value)}
            />
          )}
        </Field>

        {/* Email + Phone — stacks on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="School Email *" icon={Mail} error={errors.school_email}>
            <input
              className={inputCls(errors.school_email)}
              placeholder="info@school.edu.ph"
              type="email"
              value={form.school_email}
              onChange={(e) => setField('school_email', e.target.value)}
            />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <input
              className={inputCls(false)}
              placeholder="+63 912 345 6789"
              value={form.school_phone}
              onChange={(e) => setField('school_phone', e.target.value)}
            />
          </Field>
        </div>

        {/* Judge Password */}
        <Field label="Judge Password *" icon={Lock} error={errors.judge_password}>
          <p className="text-[10px] text-[#8FA192] mb-1.5 -mt-1">
            Judges will use the school email + this password to log in.
          </p>
          <div className="relative">
            <input
              type={showJudgePw ? 'text' : 'password'}
              className={`${inputCls(errors.judge_password)} pr-10`}
              placeholder="Min. 8 characters"
              value={form.judge_password}
              onChange={(e) => setField('judge_password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowJudgePw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center text-[#6C7A71] hover:text-[#1B4332] transition-colors"
            >
              {showJudgePw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <StrengthBar pw={form.judge_password} />
        </Field>

        {/* Address */}
        <AddressSection loc={loc} errors={errors} setErrors={setErrors} />

      </div>
    </div>
  );
}