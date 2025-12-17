import React, { useState, useEffect } from 'react';
import { RoleDefinition } from '../../types';
import { PermissionSelector } from './PermissionSelector';
import { Save, X } from 'lucide-react';

interface RoleFormProps {
    initialRole?: RoleDefinition;
    onSave: (role: RoleDefinition) => Promise<void>;
    onCancel: () => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({ initialRole, onSave, onCancel }) => {
    const [name, setName] = useState(initialRole?.name || '');
    const [id, setId] = useState(initialRole?.id || '');
    const [description, setDescription] = useState(initialRole?.description || '');
    const [allowedPaths, setAllowedPaths] = useState<string[]>(initialRole?.allowedPaths || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditing = !!initialRole;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !id) {
            setError('ID y Nombre son obligatorios');
            return;
        }

        // Simple validation for ID format
        if (!isEditing && !/^[a-z0-9_]+$/.test(id)) {
            setError('El ID solo puede contener letras minúsculas, números y guiones bajos (ej: project_manager)');
            return;
        }

        setLoading(true);
        try {
            await onSave({
                id,
                name,
                description,
                allowedPaths
            });
        } catch (err: any) {
            console.error(err);
            setError('Error al guardar el rol: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
                </h3>
                <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID del Rol</label>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        disabled={isEditing}
                        placeholder="ej: marketing_lead"
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {!isEditing && <p className="text-xs text-slate-400 mt-1">Identificador único (sin espacios).</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Visible</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ej: Responsable de Marketing"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción breve de las responsabilidades de este rol..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                <PermissionSelector
                    selectedPaths={allowedPaths}
                    onChange={setAllowedPaths}
                />
            </div>

            <div className="flex justify-end pt-4 gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-2"
                >
                    {loading ? 'Guardando...' : <><Save size={16} /> Guardar Rol</>}
                </button>
            </div>
        </form>
    );
};
