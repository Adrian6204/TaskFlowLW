
import React, { useState, useEffect } from 'react';

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [show, setShow] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setShow(true), 10);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
            setName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
            onClose();
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex justify-center items-center p-4 transition-all duration-300 ${show ? 'visible' : 'invisible'}`}>
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div className={`bg-white dark:bg-black/60 dark:backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-sm p-6 relative z-10 transition-all duration-300 transform border border-transparent dark:border-white/10 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New List</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Lists help you organize tasks within a space.</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            List Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Backlog, In Progress..."
                            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-neutral-900 dark:focus:border-white bg-white dark:bg-white/5 dark:text-white transition-all duration-200"
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
                            disabled={!name.trim()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20"
                        >
                            Create List
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListModal;
