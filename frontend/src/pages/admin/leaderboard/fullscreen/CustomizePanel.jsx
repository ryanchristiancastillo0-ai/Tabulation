import { FiSave } from 'react-icons/fi';
import { ColorField, TextField } from './FormFields';

export default function CustomizePanel({
  showPanel,
  bgColor, accentColor, textColor, titleText, subtitleText,
  contestPlaceholder, onChange, onSave, isSaving, isSaved,
}) {
  if (!showPanel) return null;

  return (
    <div className="relative z-10 mx-4 sm:mx-10 lg:mx-16 mt-4 rounded-sm border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p
          className="text-[11px] font-black tracking-[0.15em] uppercase"
          style={{ color: textColor, opacity: 0.5 }}
        >
          Customize Display
        </p>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 text-xs font-black tracking-widest uppercase px-4 py-2 rounded-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:  isSaved ? 'rgba(34,197,94,0.2)' : `${accentColor}30`,
            borderColor: isSaved ? 'rgba(34,197,94,0.4)' : `${accentColor}50`,
            color:       isSaved ? '#40916C' : textColor,
          }}
        >
          {isSaving ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <FiSave size={13} /> Saved
            </>
          ) : (
            <>
              <FiSave size={13} /> Save
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <ColorField
          label="Background"
          value={bgColor}
          onChange={v => onChange('bgColor', v)}
        />
        <ColorField
          label="Accent"
          value={accentColor}
          onChange={v => onChange('accentColor', v)}
        />
        <ColorField
          label="Text"
          value={textColor}
          onChange={v => onChange('textColor', v)}
        />
        <TextField
          label="Title Override"
          value={titleText}
          onChange={v => onChange('titleText', v)}
          placeholder={contestPlaceholder || 'Contest name'}
        />
        <TextField
          label="Subtitle Override"
          value={subtitleText}
          onChange={v => onChange('subtitleText', v)}
          placeholder="Subtitle text"
        />
      </div>
    </div>
  );
}