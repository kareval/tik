import React, { useEffect, useState } from 'react';
import { subscribeToCollection, addItem, updateItem, deleteItem } from '../../services/firestore';
import { RoleDefinition } from '../../types';
import { Shield, Lock, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { RoleForm } from '../../components/admin/RoleForm';

export const RolesPage: React.FC = () => {
    const [roles, setRoles] = useState<RoleDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleDefinition | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('roles', (data: any[]) => {
            setRoles(data as RoleDefinition[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreate = () => {
        setEditingRole(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (role: RoleDefinition) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleDelete = async (roleId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este rol? Si hay usuarios asignados a él, perderán sus permisos.')) {
            return;
        }
        try {
            await deleteItem('roles', roleId);
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el rol');
        }
    };

    const handleSaveRole = async (roleData: RoleDefinition) => {
        if (editingRole) {
            await updateItem('roles', roleData.id, roleData);
        } else {
            await addItem('roles', roleData, roleData.id); // Use ID as document ID
        }
        setIsModalOpen(false);
    };

    if (loading) return <div className="p-8">Cargando roles...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-brand-500" />
                        Definición de Roles
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestiona los roles y permisos de acceso al sistema.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Nuevo Rol
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <div key={role.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full group relative overflow-hidden active:scale-[0.99] transition-transform duration-200">

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                                <Shield className="text-brand-600 dark:text-brand-400" size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700/50 rounded text-slate-500 dark:text-slate-400">
                                    {role.id}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(role)}
                                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{role.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 min-h-[3rem]">
                            {role.description}
                        </p>

                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-1">
                                <Lock size={12} /> Permisos ({role.allowedPaths.includes('*') ? 'TOTAL' : role.allowedPaths.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {role.allowedPaths.slice(0, 5).map((path) => (
                                    <span key={path} className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs rounded border border-slate-200 dark:border-slate-600 font-mono">
                                        {path === '*' ? 'Acceso Total' : path}
                                    </span>
                                ))}
                                {role.allowedPaths.length > 5 && (
                                    <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs rounded border border-slate-200 dark:border-slate-700">
                                        +{role.allowedPaths.length - 5} más
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
                        <RoleForm
                            initialRole={editingRole}
                            onSave={handleSaveRole}
                            onCancel={() => setIsModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
