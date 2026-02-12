import React, { useEffect, useState } from 'react';

interface BackgroundProps {
    videoSrc?: string;
    className?: string;
    noOverlays?: boolean;
}

const Background: React.FC<BackgroundProps> = ({ videoSrc, className, noOverlays }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`bg-app-container ${className || 'fixed inset-0'} z-[-10] overflow-hidden bg-[#F0F2F5] dark:bg-black transition-colors duration-1000`}>
            {/* Fallback Mesh Gradient (always present as base layer) */}
            <div className="mesh-gradient absolute w-[150vw] h-[150vh] top-[-25vh] left-[-25vw] filter blur-[80px] opacity-100 dark:opacity-60 transition-opacity duration-1000" />

            {/* Video Overlay */}
            {videoSrc && (
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${noOverlays
                            ? 'opacity-60 dark:opacity-80'
                            : 'opacity-10 dark:opacity-20 blur-sm'
                        }`}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
            )}


            {/* Overlays - conditionally rendered */}
            {!noOverlays && (
                <>
                    {/* Noise Overlay */}
                    <div className="bg-noise absolute inset-0 opacity-[0.03] pointer-events-none" />

                    {/* Solid Dark Overlay for Premium Vibe (Dark Mode Only) */}
                    <div className="absolute inset-0 hidden dark:block bg-[#0A0A0A]/60 pointer-events-none transition-opacity duration-1000" />

                    {/* Protective contrast layer */}
                    <div className="absolute inset-0 bg-black/[0.03] dark:bg-transparent pointer-events-none transition-opacity duration-1000" />

                    {/* Stylized Vignette/Glow overlay for depth */}
                    <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-50 dark:opacity-80 transition-opacity duration-1000" />
                </>
            )}
        </div>
    );
};

export default Background;
