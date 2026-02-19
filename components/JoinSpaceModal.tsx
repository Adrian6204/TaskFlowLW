
import React, { useState, useEffect } from 'react';

interface JoinSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

const JoinSpaceModal: React.FC<JoinSpaceModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      setCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim());
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] flex justify-center items-center p-4 transition-all duration-300 ${show ? 'visible' : 'invisible'}`}>
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative z-10 transition-all duration-300 transform border border-transparent dark:border-slate-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Join a Space</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the Join Code provided by the space administrator (found in Space Settings).</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Join Code</label>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[\s-]/g, ''))}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20"
            >
              Join Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinSpaceModal;
