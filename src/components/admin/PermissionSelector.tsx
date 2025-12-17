import React from 'react';
import { MENU_ITEMS } from '../../constants';
import { Lock, Check } from 'lucide-react';

interface PermissionSelectorProps {
    selectedPaths: string[];
    onChange: (paths: string[]) => void;
}

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({ selectedPaths, onChange }) => {

    // Helper to toggle a path
    const togglePath = (path: string) => {
        if (selectedPaths.includes(path)) {
            onChange(selectedPaths.filter(p => p !== path));
        } else {
            onChange([...selectedPaths, path]);
        }
    };

    const isAllSelected = selectedPaths.includes('*');

    const handleSelectAll = () => {
        if (isAllSelected) {
            onChange([]);
        } else {
            onChange(['*']);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Permisos de Acceso</label>
                <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${isAllSelected
                            ? 'bg-brand-100 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-300'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}
                >
                    {isAllSelected ? 'Desmarcar todos' : 'Acceso Total (*)'}
                </button>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${isAllSelected ? 'opacity-50 pointer-events-none' : ''}`}>
                {MENU_ITEMS.map((item) => {
                    const isSelected = selectedPaths.includes(item.path) || isAllSelected;
                    return (
                        <div
                            key={item.path}
                            onClick={() => !isAllSelected && togglePath(item.path)}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                ${isSelected
                                    ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/10 dark:border-brand-800 shadow-sm'
                                    : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-transparent'
                                    }`}>
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className={`text-sm ${isSelected ? 'font-medium text-brand-900 dark:text-brand-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {item.label}
                                </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">{item.path}</span>
                        </div>
                    );
                })}
            </div>
            {isAllSelected && (
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 mt-2">
                    <Lock size={12} /> Este rol tiene permisos de super-administrador (acceso a todo).
                </p>
            )}
        </div>
    );
};
