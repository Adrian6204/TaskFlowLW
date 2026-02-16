
import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface TagPillProps {
  text: string;
  onRemove?: () => void;
  onClick?: () => void;
}

const TagPill: React.FC<TagPillProps> = ({ text, onRemove, onClick }) => {
  // Deterministic color generation based on text
  const getColorClasses = (str: string) => {
    const colors = [
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300 border-lime-200 dark:border-lime-800',
      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
      'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getColorClasses(text);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm transition-all duration-200 ${colorClass} ${onClick ? 'cursor-pointer hover:opacity-80 hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      {text}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1.5 -mr-0.5 h-3.5 w-3.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 inline-flex items-center justify-center transition-colors focus:outline-none"
        >
          <span className="sr-only">Remove {text} tag</span>
          <XMarkIcon className="h-2.5 w-2.5 stroke-[3]" />
        </button>
      )}
    </span>
  );
};

export default TagPill;