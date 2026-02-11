
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from './icons/XMarkIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { extractNameFromImage } from '../services/openRouterService';

interface IdScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (name: string) => void;
}

export const IdScannerModal: React.FC<IdScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<string>('Align your ID card within the frame');
    const [scanProgress, setScanProgress] = useState(0);

    const processImage = useCallback(async () => {
        if (!webcamRef.current || isProcessing) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);
        setStatus('AI is analyzing your ID...');
        setScanProgress(30);

        try {
            // Use OpenRouter Vision API instead of Tesseract
            const extractedName = await extractNameFromImage(imageSrc);
            setScanProgress(100);

            if (extractedName && extractedName !== "Unknown") {
                setStatus(`Verified: ${extractedName}`);
                setTimeout(() => {
                    onScan(extractedName);
                    onClose();
                }, 1500);
            } else {
                setStatus('Could not find a name. Please try again.');
                setIsProcessing(false);
                setScanProgress(0);
            }
        } catch (error) {
            console.error('OCR Error:', error);
            setStatus(error instanceof Error ? error.message : 'Scan failed. Please try again.');
            setIsProcessing(false);
            setScanProgress(0);
        }
    }, [isProcessing, onScan, onClose]);

    // We'll remove auto-scan for cloud-based OCR to save tokens and for better UX
    // The user should click "Verify Now"

    if (!isOpen) return null;

    const simulateScan = () => {
        setIsProcessing(true);
        setStatus('Simulating AI scan...');
        setScanProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                const demoNames = ['John Doe', 'Jane Smith', 'Alice Johnson'];
                const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
                setStatus(`Found: ${randomName}`);
                setTimeout(() => {
                    onScan(randomName);
                    onClose();
                }, 1000);
            }
        }, 100);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <VideoCameraIcon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">AI Identity Verification</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-neutral-400" />
                        </button>
                    </div>

                    {/* Camera View */}
                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <Webcam
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover opacity-60"
                            videoConstraints={{ facingMode: 'user' }}
                        />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            {/* Portrait ID Frame - Tall and Narrow */}
                            <div className="relative w-[40%] h-[80%] border-2 border-white/5 rounded-[2rem] shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]">
                                {/* Corner Accents - Extra prominent */}
                                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-2xl" />
                                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-2xl" />
                                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-2xl" />
                                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-2xl" />

                                {/* Scanning Bar */}
                                <motion.div
                                    animate={{ top: ['5%', '95%', '5%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute left-1/2 -translate-x-1/2 w-[90%] h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_rgba(255,255,255,1)]"
                                />
                            </div>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute bottom-8 left-0 right-0 p-4 flex flex-col items-center gap-4">
                            <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                                {isProcessing ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        <span className="text-white font-medium">{status}</span>
                                    </div>
                                ) : (
                                    <span className="text-white/80 font-medium">{status}</span>
                                )}
                            </div>

                            {scanProgress > 0 && (
                                <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                        className="h-full bg-white shadow-[0_0_10px_white]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 bg-neutral-900/50 flex items-center justify-between">
                        <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                            Powered by OpenRouter Vision
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={simulateScan}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                            >
                                Simulate
                            </button>
                            <button
                                onClick={processImage}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-white hover:bg-neutral-100 text-black text-sm font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isProcessing ? 'Analyzing...' : 'Verify Identity'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
