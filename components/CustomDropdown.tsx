import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { SearchIcon } from './icons/SearchIcon';
import { XMarkIcon } from './icons/XMarkIcon';

export interface DropdownOption<T = string | number> {
    value: T;
    label: string;
    icon?: React.ReactNode;
    subtitle?: string;
    color?: string;
}

interface CustomDropdownProps<T = string | number> {
    label?: string;
    value: T | T[] | null;
    options: DropdownOption<T>[];
    onChange: (value: T | T[]) => void;
    placeholder?: string;
    multiple?: boolean;
    searchable?: boolean;
    className?: string;
    menuClassName?: string;
    disabled?: boolean;
    error?: string;
}

const CustomDropdown = <T extends string | number>({
    label,
    value,
    options,
    onChange,
    placeholder = "Select an option",
    multiple = false,
    searchable = false,
    className = "",
    menuClassName = "",
    disabled = false,
    error,
}: CustomDropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOptions = options.filter(opt => 
        multiple 
            ? Array.isArray(value) && value.includes(opt.value)
            : value === opt.value
    );

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm("");
        }
    };

    const handleSelect = (optionValue: T) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            onChange(newValues);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(multiple ? [] : (null as unknown as T));
    };

    return (
        <div className={`relative flex flex-col gap-1.5 w-full ${className}`} ref={dropdownRef}>
            {label && (
                <label className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest px-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all duration-300
                    ${isOpen 
                        ? 'border-lime-500 ring-4 ring-lime-500/10 dark:border-lime-500/50 dark:ring-lime-500/5' 
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-white/5' : 'bg-white/80 dark:bg-black/20 backdrop-blur-sm'}
                    ${error ? 'border-rose-500 ring-rose-500/10' : ''}
                `}
            >
                <div className="flex-1 flex flex-wrap gap-1.5 min-h-[1.5rem] items-center text-left">
                    {selectedOptions.length > 0 ? (
                        multiple ? (
                            selectedOptions.map(opt => (
                                <span 
                                    key={String(opt.value)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lime-500/10 text-lime-700 dark:text-lime-400 text-[11px] font-bold border border-lime-500/20"
                                >
                                    {opt.label}
                                    <XMarkIcon 
                                        className="w-3 h-3 cursor-pointer hover:text-rose-500" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(opt.value);
                                        }}
                                    />
                                </span>
                            ))
                        ) : (
                            <div className="flex items-center gap-2">
                                {selectedOptions[0].icon && <span className="shrink-0">{selectedOptions[0].icon}</span>}
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white/90">
                                        {selectedOptions[0].label}
                                    </p>
                                    {selectedOptions[0].subtitle && (
                                        <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">
                                            {selectedOptions[0].subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    ) : (
                        <span className="text-sm font-medium text-slate-400 dark:text-white/30 italic">
                            {placeholder}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {multiple && selectedOptions.length > 0 && !disabled && (
                        <span 
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </span>
                    )}
                    <ChevronDownIcon 
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-lime-500' : 'group-hover:text-slate-600 dark:group-hover:text-white/60'}`} 
                    />
                </div>
            </button>

            {error && (
                <p className="px-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`
                            absolute left-0 right-0 top-full mt-2 z-[100] p-2
                            bg-white/95 dark:bg-black/90 backdrop-blur-2xl
                            border border-slate-200 dark:border-white/10 rounded-2xl
                            shadow-2xl shadow-black/10 dark:shadow-none overflow-hidden flex flex-col
                            ${menuClassName}
                        `}
                    >
                        {searchable && (
                            <div className="px-2 pb-2 pt-1 border-b border-slate-100 dark:border-white/5 mb-1">
                                <div className="relative group">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-lime-500 transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-lime-500/20 outline-none transition-all"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => {
                                    const isSelected = multiple 
                                        ? Array.isArray(value) && value.includes(opt.value)
                                        : value === opt.value;
                                    
                                    return (
                                        <button
                                            key={String(opt.value)}
                                            type="button"
                                            onClick={() => handleSelect(opt.value)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group/item
                                                ${isSelected 
                                                    ? 'bg-lime-500/10 text-lime-700 dark:text-lime-400' 
                                                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                }
                                            `}
                                        >
                                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-lime-700 dark:text-lime-400' : ''}`}>
                                                        {opt.label}
                                                    </p>
                                                    {opt.subtitle && (
                                                        <p className="text-[10px] text-slate-500 dark:text-white/30 truncate uppercase tracking-widest font-bold">
                                                            {opt.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center shadow-lg shadow-lime-500/20 flex-shrink-0"
                                                >
                                                    <span className="text-[10px] text-white font-black">✓</span>
                                                </motion.div>
                                            )}
                                            
                                            {multiple && !isSelected && (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-white/10 group-hover/item:border-lime-500/50 transition-colors flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No results found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomDropdown;
