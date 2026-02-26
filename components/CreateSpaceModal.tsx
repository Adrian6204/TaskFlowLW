
import React, { useState, useEffect } from 'react';
import { Space } from '../types';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onCreate(name, description.trim());
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Space</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a separate workspace for your team or project. You'll get a unique code to invite others.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Space Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Q4, Alpha Team..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this space about? (e.g. Q4 Marketing campaigns and strategy)"
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-all duration-200"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description.length}/200 characters
            </p>
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
              disabled={!name.trim() || !description.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20"
            >
              Create Space
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSpaceModal;
