import React, { useEffect, useState } from 'react';
import { subscribeToCollection, updateItem, deleteItem, addItem, setItem } from '../../services/firestore';
import { UserProfile, RoleDefinition } from '../../types';
import { UserCog, Pencil, Trash2, Search, UserPlus, X, Mail, Lock, User, Terminal } from 'lucide-react';
import { UserForm } from '../../components/admin/UserForm';
import { createUserForTesting } from '../../services/authAdmin';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<RoleDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | undefined>(undefined);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState<'invite' | 'direct'>('direct');
    const [newUser, setNewUser] = useState({
        displayName: '',
        email: '',
        password: '',
        roleId: '',
        managerEmail: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const unsubscribeUsers = subscribeToCollection('users', (data: any[]) => {
            setUsers(data as UserProfile[]);
            setLoading(false);
        });

        const unsubscribeRoles = subscribeToCollection('roles', (data: any[]) => {
            setRoles(data as RoleDefinition[]);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeRoles();
        };
    }, []);

    const handleEdit = (user: UserProfile) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Perderá el acceso a la aplicación, aunque su cuenta de Google/Email seguirá existiendo.')) {
            return;
        }
        try {
            await deleteItem('users', userId);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error al eliminar el usuario");
        }
    };

    const handleSaveUser = async (userId: string, data: Partial<UserProfile>) => {
        try {
            await updateItem('users', userId, data);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            if (creationMode === 'direct') {
                if (!newUser.password || newUser.password.length < 6) {
                    alert("La contraseña debe tener al menos 6 caracteres.");
                    setIsCreating(false);
                    return;
                }

                // 1. Create Auth User (Secondary App Pattern)
                const uid = await createUserForTesting(newUser.email, newUser.password);

                // 2. Create Firestore Profile
                const profile: UserProfile = {
                    uid: uid,
                    email: newUser.email,
                    displayName: newUser.displayName,
                    roleId: newUser.roleId || 'subcontractor', // Default
                    photoURL: '',
                    managerEmail: newUser.managerEmail
                };

                await setItem('users', uid, profile);
                alert(`Usuario creado correctamente.\nEmail: ${newUser.email}\nUID: ${uid}`);
                setIsCreateModalOpen(false);
                setNewUser({ displayName: '', email: '', password: '', roleId: '', managerEmail: '' });

            } else {
                // 'invite' mode
                const inviteData = {
                    email: newUser.email,
                    displayName: newUser.displayName,
                    roleId: newUser.roleId,
                    managerEmail: newUser.managerEmail,
                    createdAt: new Date().toISOString(),
                    status: 'pending'
                };
                // We use 'user_invites' collection. Assuming it is allowed by rules or will be.
                await addItem('user_invites', inviteData);
                alert(`Invitación creada para ${newUser.email}. El usuario podrá registrarse y reclamarla.`);
                setIsCreateModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            alert('Error al crear usuario: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    // Filtered Users
    const filteredUsers = users.filter(user =>
        (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    const projectManagers = users.filter(u => u.roleId === 'project_manager' || u.roleId === 'director');

    if (loading) return <div className="p-8">Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserCog className="text-brand-500" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Administra los usuarios ({users.length}) y sus roles en la plataforma.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Nuevo Usuario
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Usuario</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Email</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Rol Actual</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Responsable</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold shrink-0">
                                                {user.displayName?.charAt(0) || 'U'}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{user.displayName || 'Sin nombre'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                            ${user.roleId === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                user.roleId === 'director' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    user.roleId === 'project_manager' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        user.roleId === 'subcontractor' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                                            {roles.find(r => r.id === user.roleId)?.name || 'Invitado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                        {user.managerEmail || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                                                title="Editar Usuario"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.uid)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Eliminar Usuario (Revocar Acceso)"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                        No se encontraron usuarios coincidenes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Edit User */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
                        <UserForm
                            user={editingUser}
                            roles={roles}
                            projectManagers={projectManagers}
                            onSave={handleSaveUser}
                            onCancel={() => setIsEditModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Modal for Create User */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <UserPlus size={20} className="text-brand-600" />
                                {creationMode === 'direct' ? 'Crear Usuario (Admin Directo)' : 'Invitar Usuario'}
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Toggle Strategy */}
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-6">
                                <button
                                    onClick={() => setCreationMode('direct')}
                                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-2
                                        ${creationMode === 'direct'
                                            ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Terminal size={14} /> Creación Directa (Dev)
                                </button>
                                <button
                                    onClick={() => setCreationMode('invite')}
                                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all flex items-center justify-center gap-2
                                        ${creationMode === 'invite'
                                            ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Mail size={14} /> Invitación Email
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            required
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                            value={newUser.displayName}
                                            onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                                            placeholder="Ej. Juan Pérez"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="juan@empresa.com"
                                        />
                                    </div>
                                </div>

                                {creationMode === 'direct' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contraseña Inicial</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                required={creationMode === 'direct'}
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white font-mono"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Rol Asignado</label>
                                    <select
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                        value={newUser.roleId}
                                        onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar rol...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {newUser.roleId === 'subcontractor' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Responsable (Manager)</label>
                                        <select
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                            value={newUser.managerEmail}
                                            onChange={e => setNewUser({ ...newUser, managerEmail: e.target.value })}
                                        >
                                            <option value="">-- Sin asignar --</option>
                                            {projectManagers.map(pm => (
                                                <option key={pm.uid} value={pm.email}>{pm.displayName} ({pm.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="pt-4">
                                    {creationMode === 'direct' ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                            <p className="text-xs text-amber-800">
                                                <strong>Nota:</strong> Se creará el usuario en Authentication y su perfil en Firestore inmediatamente.
                                                Tú sesión actual <strong>NO</strong> se cerrará.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="text-xs text-blue-800">
                                                <strong>Nota:</strong> Se guardará una invitación. El usuario deberá "Registrarse" con este email para reclamarla.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-all shadow-lg hover:shadow-brand-600/30 flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? 'Procesando...' : (
                                            creationMode === 'direct' ? <><Terminal size={18} /> Crear Usuario Ahora</> : <><Mail size={18} /> Enviar Invitación</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
