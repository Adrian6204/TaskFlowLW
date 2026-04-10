import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  requireString?: string;
  inputPlaceholder?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  requireString,
  inputPlaceholder = 'Type here...'
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      hover: 'hover:bg-red-600',
      border: 'border-red-500/20',
      focus: 'focus:ring-red-500/30'
    },
    warning: {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      hover: 'hover:bg-orange-600',
      border: 'border-orange-500/20',
      focus: 'focus:ring-orange-500/30'
    },
    info: {
      bg: 'bg-primary-500',
      text: 'text-primary-500',
      hover: 'hover:bg-primary-600',
      border: 'border-primary-500/20',
      focus: 'focus:ring-primary-500/30'
    }
  };

  const color = colors[type];
  const isConfirmDisabled = requireString ? inputValue !== requireString : false;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-black/80 dark:backdrop-blur-2xl rounded-[32px] shadow-2xl p-8 border border-white/50 dark:border-white/10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h3 className={`text-2xl font-black ${color.text} mb-3`}>{title}</h3>
          <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
            {message}
          </p>
        </div>

        {requireString && (
          <div className="mb-8 animate-in slide-in-from-bottom-2 duration-300">
            <label className="block text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">
              Type <span className="text-slate-900 dark:text-white px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md">"{requireString}"</span> to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className={`w-full bg-slate-50 dark:bg-white/5 border ${color.border} rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-black placeholder-slate-400 focus:outline-none focus:ring-4 ${color.focus} transition-all duration-300`}
            />
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-slate-500 dark:text-slate-400 font-black text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors uppercase tracking-widest"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              if (isConfirmDisabled) return;
              onConfirm();
              onClose();
            }}
            disabled={isConfirmDisabled}
            className={`px-8 py-3 rounded-2xl text-white font-black text-sm shadow-xl transition-all transform active:scale-95 uppercase tracking-widest ${color.bg} ${color.hover} ${isConfirmDisabled ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:scale-105 hover:-translate-y-0.5'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;