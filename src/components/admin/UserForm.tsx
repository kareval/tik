import React, { useState } from 'react';
import { UserProfile, RoleDefinition } from '../../types';
import { Save, X, User, Mail, Shield, Briefcase } from 'lucide-react';

interface UserFormProps {
    user: UserProfile;
    roles: RoleDefinition[];
    projectManagers: UserProfile[]; // List of Project Managers for assignment
    onSave: (userId: string, data: Partial<UserProfile>) => Promise<void>;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, roles, projectManagers, onSave, onCancel }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [roleId, setRoleId] = useState(user.roleId || '');
    const [managerEmail, setManagerEmail] = useState(user.managerEmail || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onSave(user.uid, {
                displayName,
                roleId: roleId || null, // If empty string, save as null
                managerEmail: managerEmail || undefined // If empty, undefined to potentially remove field
            });
        } catch (err: any) {
            console.error(err);
            setError('Error al guardar el usuario: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <User className="text-brand-500" />
                    Editar Usuario
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

            <div className="space-y-4">
                {/* Read-only Email */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (No editable)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={user.email}
                            disabled
                            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nombre Apellidos"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                </div>

                {/* Role Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol Asignado</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                        >
                            <option value="">-- Sin Rol (Invitado) --</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    {roleId && (
                        <p className="text-xs text-slate-500 mt-1">
                            {roles.find(r => r.id === roleId)?.description}
                        </p>
                    )}
                </div>

                {/* Manager Selector (Only if Subcontractor) */}
                {roleId === 'subcontractor' && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsable (Project Manager)</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                value={managerEmail}
                                onChange={(e) => setManagerEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                            >
                                <option value="">-- Sin Responsable --</option>
                                <option value="manager@example.com">Manager Demo (manager@example.com)</option>
                                {projectManagers.map(pm => (
                                    <option key={pm.uid} value={pm.email}>{pm.displayName} ({pm.email})</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Este usuario enviará sus horas para aprobación a este manager.
                        </p>
                    </div>
                )}
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
                    {loading ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
                </button>
            </div>
        </form>
    );
};
