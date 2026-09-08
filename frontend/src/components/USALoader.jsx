import React from 'react';

const LOADER_CSS = `
  .usal-loader-root,
  .usal-loader-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  .usal-loader-wrap {
    min-height: 0;
    width: 100%;
    padding: 40px 0;
  }

  .usal-loader {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .usal-loader .particles {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: usalShowParticles 4s infinite;
  }

  .usal-loader .dots {
    --d: 26px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    color: #2f9e44;
    box-shadow:
      calc(1*var(--d))            calc(0*var(--d))           0 0    #2f9e44,
      calc(0.707*var(--d))        calc(0.707*var(--d))       0 1px  #8bc34a,
      calc(0*var(--d))            calc(1*var(--d))           0 2px  #cddc39,
      calc(-0.707*var(--d))       calc(0.707*var(--d))       0 3px  #ffeb3b,
      calc(-1*var(--d))           calc(0*var(--d))           0 4px  #4fc3f7,
      calc(-0.707*var(--d))       calc(-0.707*var(--d))      0 5px  #29b6f6,
      calc(0*var(--d))            calc(-1*var(--d))          0 6px  #66bb6a,
      calc(0.707*var(--d))        calc(-0.707*var(--d))      0 7px  #9ccc65;
    animation: usalSpin 1s infinite steps(8);
  }

  @keyframes usalSpin {
    100% { transform: rotate(1turn); }
  }

  @keyframes usalShowParticles {
    0%   { opacity: 1; transform: scale(1); }
    30%  { opacity: 1; transform: scale(1); }
    40%  { opacity: 0; transform: scale(.3); }
    90%  { opacity: 0; transform: scale(.3); }
    100% { opacity: 1; transform: scale(1); }
  }

  .usal-loader .logo {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: usalShowLogo 4s infinite;
  }

  .usal-loader .logo svg {
    width: 70px;
    height: 70px;
  }

  @keyframes usalShowLogo {
    0%   { opacity: 0; transform: scale(.3); }
    40%  { opacity: 0; transform: scale(.3); }
    50%  { opacity: 1; transform: scale(1); }
    80%  { opacity: 1; transform: scale(1); }
    90%  { opacity: 0; transform: scale(.3); }
    100% { opacity: 0; transform: scale(.3); }
  }

  .usal-loader .usal-prompt {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding-top: 16px;
    white-space: nowrap;
  }
`;

export default function USALoader({
  fullScreen = true,
  prompt = 'Loading…',
  background = '#0f1115',
  dark = true,
}) {
  const core = (
    <div className="usal-loader">
      <div className="particles">
        <div className="dots" />
      </div>
      <div className="logo">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,150 C58,140 38,92 58,48 C92,68 100,112 100,150 Z" fill="#ffeb3b" />
          <path d="M100,150 C132,140 148,98 142,66 C114,84 100,116 100,150 Z" fill="#4fc3f7" />
          <path d="M100,18 C132,54 142,102 100,155 C58,102 68,54 100,18 Z" fill="#2e9e46" />
        </svg>
      </div>
      {prompt && (
        <div
          className="usal-prompt"
          style={{ color: dark ? '#9ca3af' : '#6c7a71' }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em]">{prompt}</span>
        </div>
      )}
    </div>
  );

  return (
    <React.Fragment>
      <style>{LOADER_CSS}</style>
      {fullScreen ? (
        <div className="usal-loader-root" style={{ background, minHeight: '100vh' }}>
          {core}
        </div>
      ) : (
        <div className="usal-loader-wrap" style={{ background }}>{core}</div>
      )}
    </React.Fragment>
  );
}
