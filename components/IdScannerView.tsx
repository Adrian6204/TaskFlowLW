import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { extractNameFromImage } from '../services/openRouterService';

interface IdScannerViewProps {
    onScan: (name: string) => void;
    onCancel?: () => void;
}

export const IdScannerView: React.FC<IdScannerViewProps> = ({ onScan, onCancel }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('Align your ID card');
    const [scanProgress, setScanProgress] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, []);

    const playScanBeep = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const playSuccessBeep = useCallback(() => {
        try {
            const audio = new Audio('/sounds/success.mp3');
            audio.volume = 0.5;
            audio.play().catch(console.error);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const processImage = useCallback(async () => {
        if (!webcamRef.current || isProcessing) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        playScanBeep();
        setIsProcessing(true);
        setStatus('AI Analyzing...');
        setScanProgress(30);

        try {
            const extractedName = await extractNameFromImage(imageSrc);
            setScanProgress(100);
            if (extractedName && extractedName !== "Unknown") {
                playSuccessBeep();
                setStatus(`Verified: ${extractedName}`);
                setTimeout(() => onScan(extractedName), 1500);
            } else {
                setStatus('Could not find name');
                setIsProcessing(false);
                setScanProgress(0);
            }
        } catch (error) {
            setStatus('Scan failed');
            setIsProcessing(false);
            setScanProgress(0);
        }
    }, [isProcessing, onScan]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isProcessing) processImage();
        }, 5000);
        return () => clearInterval(interval);
    }, [isProcessing, processImage]);

    return (
        <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden animate-fade-in">
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover opacity-60"
                videoConstraints={{ facingMode: 'user' }}
            />

            {/* Full-Window Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none p-4">
                <div className="relative w-full h-full border-2 border-white/10 rounded-[2rem]">
                    {/* Corner Accents - Positioned at the very edges of the rounded window */}
                    <div className="absolute -top-1 -left-1 w-16 h-16 border-t-4 border-l-4 border-white/80 rounded-tl-2xl" />
                    <div className="absolute -top-1 -right-1 w-16 h-16 border-t-4 border-r-4 border-white/80 rounded-tr-2xl" />
                    <div className="absolute -bottom-1 -left-1 w-16 h-16 border-b-4 border-l-4 border-white/80 rounded-bl-2xl" />
                    <div className="absolute -bottom-1 -right-1 w-16 h-16 border-b-4 border-r-4 border-white/80 rounded-br-2xl" />

                    {/* Scanning Bar - Full Width */}
                    <motion.div
                        animate={{ top: ['2%', '98%', '2%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-1/2 -translate-x-1/2 w-[98%] h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                    />
                </div>
            </div>

            {/* Controls/Status */}
            <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
                <div className="flex justify-end items-start pointer-events-auto">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                    <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
                        <span className="text-white font-medium text-sm">{status}</span>
                    </div>
                    {scanProgress > 0 && (
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${scanProgress}%` }}
                                className="h-full bg-white shadow-[0_0_10px_white]"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
