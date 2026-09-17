import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

const LogoUploadField = ({ label, value, onChange, readOnly }) => {
  const inputRef = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL('image/jpeg', 0.75));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  return (
    <div>
      <div className="field-label">{label}</div>
      <div
        onClick={() => { if (!readOnly) inputRef.current.click(); }}
        style={{
          border: '2px dashed var(--accent-bd)',
          borderRadius: 6,
          padding: '16px 14px',
          cursor: readOnly ? 'default' : 'pointer',
          background: value ? 'var(--accent-lt)' : 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'all .2s',
          opacity: readOnly ? 0.6 : 1,
          position: 'relative',
        }}
        onMouseEnter={e => { if (!readOnly) e.currentTarget.style.borderColor = 'var(--accent-mid)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; }}
      >
        {value ? (
          <>
            <img src={value} alt={label} style={{ width: 40, height: 40, borderRadius: 5, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
            <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>✓ Uploaded</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{readOnly ? 'Enter edit mode to replace' : 'Click to replace'}</div></div>
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                title="Remove image"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red-bd)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <X size={13} />
              </button>
            )}
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 5, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
              <Upload size={16} style={{ color: 'var(--text3)' }} />
            </div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Click to upload</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>PNG, JPG, SVG — stored as base64</div></div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
};
export default LogoUploadField