import React from 'react';
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
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      hover: 'hover:bg-red-600',
    },
    warning: {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      hover: 'hover:bg-orange-600',
    },
    info: {
      bg: 'bg-primary-500',
      text: 'text-primary-500',
      hover: 'hover:bg-primary-600',
    }
  };

  const color = colors[type];

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-black/60 dark:backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50 dark:border-white/10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className={`text-xl font-black ${color.text} mb-2`}>{title}</h3>
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${color.bg} ${color.hover}`}
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