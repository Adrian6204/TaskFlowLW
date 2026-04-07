import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

    useEffect(() => {
        // Phase: enter animations play (0ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ900ms)
        // Phase: hold (900msÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ1800ms)
        // Phase: exit fade-out (1800msÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ2400ms)
        // Complete: unmount after exit
        const holdTimer = setTimeout(() => setPhase('hold'), 900);
        const exitTimer = setTimeout(() => setPhase('exit'), 1800);
        const doneTimer = setTimeout(() => onComplete(), 2600);

        return () => {
            clearTimeout(holdTimer);
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
        };
    }, [onComplete]);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#133020', // Lifewood Dark Serpent (Matches PWA Manifest)
                opacity: phase === 'exit' ? 0 : 1,
                transition: phase === 'exit' ? 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
                pointerEvents: phase === 'exit' ? 'none' : 'all',
            }}
        >
            {/* Ambient subtle glow blobs using Lifewood colors */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', 
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'splashPulse 3s ease-in-out infinite',
                pointerEvents: 'none',
            }} />

            {/* Main container */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                animation: phase === 'enter' ? 'splashLogoIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
                opacity: phase === 'enter' ? 0 : 1,
                zIndex: 10,
            }}>

                {/* Logo with subtle pulsing border */}
                <div style={{ position: 'relative' }}>
                    {/* Spinning ring */}
                    <div style={{
                        position: 'absolute',
                        inset: '-5px',
                        borderRadius: '36px',
                        padding: '2px',
                        background: 'conic-gradient(from 0deg, rgba(255,255,255,0.1), rgba(4,152,98,0.8), rgba(255,179,71,0.4), rgba(255,255,255,0.1))',
                        animation: 'splashSpin 4s linear infinite',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px))',
                        opacity: 0.8,
                    }} />

                    {/* Logo Plate */}
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '32px',
                        background: 'rgba(255,255,255,0.05)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                        position: 'relative',
                        zIndex: 2,
                    }}>
                        <img
                            src="/logo.png"
                            alt="TaskFlow Logo"
                            style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                        />
                    </div>
                </div>

                {/* Typography group */}
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '38px',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: '#ffffff', 
                        fontFamily: "'Inter', sans-serif",
                        animation: phase === 'enter' ? 'splashTextIn 0.8s 0.15s cubic-bezier(0.16,1,0.3,1) both' : 'none',
                        lineHeight: '1.2'
                    }}>
                        Task<span style={{ color: '#4ade80' }}>Flow</span> 
                    </h1>
                    <p style={{
                        margin: '4px 0 0',
                        fontSize: '12px',
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.5)', 
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        animation: phase === 'enter' ? 'splashTextIn 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both' : 'none',
                    }}>
                        Elevating Your Workspace
                    </p>
                </div>

                {/* Animated progress line underneath */}
                <div style={{
                    marginTop: '16px',
                    width: '60px',
                    height: '2px',
                    background: 'rgba(19,48,32,0.08)',
                    borderRadius: '99px',
                    overflow: 'hidden',
                    animation: phase === 'enter' ? 'splashTextIn 0.6s 0.45s cubic-bezier(0.16,1,0.3,1) both' : 'none',
                }}>
                    <div style={{
                        height: '100%',
                        borderRadius: '99px',
                        background: 'linear-gradient(90deg, #046241, #FFB347)', /* Castleton to Saffaron */
                        animation: 'splashProgress 1.8s cubic-bezier(0.4,0,0.2,1) forwards',
                        transformOrigin: 'left',
                    }} />
                </div>
            </div>

            <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.9) translateY(15px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashProgress {
          0%   { transform: scaleX(0); opacity: 1; }
          60%  { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes splashSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes splashPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50%       { transform: translate(-50%, -50%) scale(1.05); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};

export default SplashScreen;
