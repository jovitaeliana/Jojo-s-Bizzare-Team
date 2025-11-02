import { useState, useEffect, useRef } from 'react';
import { X, Minus, Square } from 'lucide-react';

const WindowControls = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMinimize = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.maximize();
    }
  };

  const handleClose = () => {
    if (window.electron?.windowControls) {
      window.electron.windowControls.close();
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRevealed(true);
  };

  const handleMouseLeave = () => {
    // Small delay before hiding for better UX
    timeoutRef.current = setTimeout(() => {
      setIsRevealed(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Zen Browser-style hover trigger area */}
      <div
        className="fixed top-0 right-0 z-[100]"
        style={{
          WebkitAppRegion: 'no-drag',
          width: '200px',
          height: '40px',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top bar that slides down - Zen style */}
        <div
          className="absolute top-0 right-0 h-10 flex items-center justify-end px-2"
          style={{
            transform: isRevealed ? 'translateY(0)' : 'translateY(-5px)',
            opacity: isRevealed ? 1 : 0,
            transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isRevealed ? 'auto' : 'none',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '0 0 0 12px',
            boxShadow: isRevealed ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: 'none',
            borderRight: 'none',
          }}
        >
          {/* Window control buttons */}
          <div
            className="flex items-center gap-1"
            style={{
              opacity: isRevealed ? 1 : 0,
              transform: isRevealed ? 'translateY(0)' : 'translateY(-5px)',
              transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: isRevealed ? '50ms' : '0ms',
            }}
          >
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="zen-control-btn"
              aria-label="Minimize"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Minus size={16} className="text-white" style={{ opacity: 0.9 }} />
            </button>

            {/* Maximize Button */}
            <button
              onClick={handleMaximize}
              className="zen-control-btn"
              aria-label="Maximize"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Square size={14} className="text-white" style={{ opacity: 0.9 }} />
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="zen-control-btn"
              aria-label="Close"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={16} className="text-white" style={{ opacity: 0.9 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Global styles for Zen controls */}
      <style>{`
        .zen-control-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
};

export default WindowControls;
