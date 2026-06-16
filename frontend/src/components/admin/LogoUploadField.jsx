import React, { useState, useEffect, useRef } from 'react';
import { Upload

} from 'lucide-react';

const LogoUploadField = ({ label, value, onChange }) => {
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
      <div onClick={() => inputRef.current.click()} style={{ border: '2px dashed var(--accent-bd)', borderRadius: 10, padding: '16px 14px', cursor: 'pointer', background: value ? 'var(--accent-lt)' : 'var(--surface2)', display: 'flex', alignItems: 'center', gap: 12, transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-mid)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--accent-bd)'; }}>
        {value ? (
          <>
            <img src={value} alt={label} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
            <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>✓ Uploaded</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Click to replace</div></div>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
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