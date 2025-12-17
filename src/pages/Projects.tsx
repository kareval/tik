import React, { useState, useEffect } from 'react';
import { AppState, Action, Project, ProjectAssignment, Role, UserProfile } from '../types';
import { Search, Plus, X, User, Briefcase, Pencil } from 'lucide-react';
import { subscribeToCollection } from '../services/firestore';

interface ProjectsProps {
    state: AppState;
    dispatch: React.Dispatch<Action>;
}

export const Projects: React.FC<ProjectsProps> = ({ state, dispatch }) => {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);

    // Users for Manager Selection
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToCollection('users', (data: any[]) => {
            setUsers(data as UserProfile[]);
        });
        return () => unsubscribe();
    }, []);

    const projectManagers = users.filter(u => u.roleId === 'project_manager' || u.roleId === 'director' || u.roleId === 'admin');

    // Form state for adding assignment
    const [newAssignment, setNewAssignment] = useState<ProjectAssignment>({
        subcontractorId: '',
        hoursCap: 160,
        period: 'monthly'
    });

    const canEdit = state.currentUserRole === Role.PROJECT_MANAGER || state.currentUserRole === Role.DIRECTOR || state.currentUserRole === Role.ADMIN || state.currentUserRole === 'admin' as any;
    const canCreate = state.currentUserRole === Role.DIRECTOR || state.currentUserRole === Role.ADMIN || state.currentUserRole === 'admin' as any;

    const handleOpenAssignments = (project: Project) => {
        setSelectedProject(project);
        setIsAssignmentsModalOpen(true);
        setNewAssignment({ subcontractorId: '', hoursCap: 160, period: 'monthly' });
    };

    const handleAddAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !newAssignment.subcontractorId) return;

        // SAFETY: Garantizar que assignments existe
        const currentAssignments = selectedProject.assignments || [];

        const updatedProject = {
            ...selectedProject,
            assignments: [...currentAssignments, newAssignment]
        };

        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        setSelectedProject(updatedProject);
        setNewAssignment({ subcontractorId: '', hoursCap: 160, period: 'monthly' });
    };

    const handleRemoveAssignment = (subId: string) => {
        if (!selectedProject) return;

        const currentAssignments = selectedProject.assignments || [];

        const updatedProject = {
            ...selectedProject,
            assignments: currentAssignments.filter(a => a.subcontractorId !== subId)
        };
        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        setSelectedProject(updatedProject);
    };

    const getConsumedHours = (projectId: string, subId: string, period: 'monthly' | 'total') => {
        const logs = state.timeLogs.filter(l => l.projectId === projectId && l.subcontractorId === subId);
        if (period === 'total') {
            return logs.reduce((sum, l) => sum + l.hours, 0);
        } else {
            const currentMonth = new Date().toISOString().slice(0, 7);
            return logs
                .filter(l => l.date.startsWith(currentMonth))
                .reduce((sum, l) => sum + l.hours, 0);
        }
    };

    // Project Create/Edit Modal State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectFormData, setProjectFormData] = useState<Partial<Project>>({
        name: '',
        client: '',
        budget: 0,
        currency: 'EUR',
        managerId: '',
        assignments: []
    });

    const handleOpenCreateProject = () => {
        setEditingProject(null);
        setProjectFormData({ name: '', client: '', budget: 0, currency: 'EUR', managerId: '', assignments: [] });
        setIsProjectModalOpen(true);
    };

    const handleOpenEditProject = (project: Project) => {
        setEditingProject(project);
        setProjectFormData({
            name: project.name,
            client: project.client,
            budget: project.budget,
            currency: project.currency,
            managerId: project.managerId,
            assignments: project.assignments
        });
        setIsProjectModalOpen(true);
    };

    const handleSaveProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectFormData.name || !projectFormData.client) return;

        if (editingProject) {
            // Update
            const updatedProject: Project = {
                ...editingProject,
                name: projectFormData.name || '',
                client: projectFormData.client || '',
                budget: projectFormData.budget || 0,
                currency: projectFormData.currency || 'EUR',
                managerId: projectFormData.managerId || '',
            };
            dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
        } else {
            // Create
            const newProject: Project = {
                id: Date.now().toString(),
                name: projectFormData.name || '',
                client: projectFormData.client || '',
                budget: projectFormData.budget || 0,
                currency: projectFormData.currency || 'EUR',
                managerId: projectFormData.managerId || '',
                assignments: []
            };
            dispatch({ type: 'ADD_PROJECT', payload: newProject });
        }

        setIsProjectModalOpen(false);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Proyectos y Asignaciones</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona recursos y límites de horas por proyecto.</p>
                </div>

                {canCreate && (
                    <button
                        onClick={handleOpenCreateProject}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center gap-2"
                    >
                        <Plus size={18} /> Nuevo Proyecto
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {state.projects.map(project => {
                    // SAFETY: Asegurar array para renderizado
                    const assignments = project.assignments || [];
                    const manager = users.find(u => u.uid === project.managerId);

                    return (
                        <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{project.name}</h3>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleOpenEditProject(project)}
                                                    className="text-slate-400 hover:text-brand-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    title="Editar Detalle de Proyecto"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{project.client} • {assignments.length} recursos</p>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                            <User size={12} />
                                            <span>Responsable: {manager ? manager.displayName : 'Sin asignar'}</span>
                                        </div>
                                    </div>
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={() => handleOpenAssignments(project)}
                                        className="text-sm font-medium text-primary hover:text-primary-dark bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Gestionar Equipo
                                    </button>
                                )}
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assignments.map(assign => {
                                        const sub = state.subcontractors.find(s => s.id === assign.subcontractorId);
                                        const consumed = getConsumedHours(project.id, assign.subcontractorId, assign.period);
                                        const percent = assign.hoursCap > 0 ? Math.min(100, (consumed / assign.hoursCap) * 100) : 0;

                                        return (
                                            <div key={assign.subcontractorId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <User size={16} className="text-slate-400" />
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{sub?.name}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                                                        {assign.period === 'monthly' ? 'Mensual' : 'Total'}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                        <span>Imputado: {consumed}h</span>
                                                        <span>Tope: {assign.hoursCap}h</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-brand-500'}`}
                                                            style={{ width: `${percent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-right text-[10px] text-slate-400">
                                                        Restante: <span className="font-medium text-slate-600 dark:text-slate-300">{(assign.hoursCap - consumed).toFixed(1)}h</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {assignments.length === 0 && (
                                        <div className="col-span-full text-center py-4 text-slate-400 text-sm italic">
                                            No hay recursos asignados a este proyecto.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal Assignments */}
            {isAssignmentsModalOpen && selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white">Asignar Recurso a {selectedProject.name}</h3>
                            <button onClick={() => setIsAssignmentsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddAssignment} className="space-y-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Recurso</label>
                                    <select
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                        value={newAssignment.subcontractorId}
                                        onChange={e => setNewAssignment({ ...newAssignment, subcontractorId: e.target.value })}
                                    >
                                        <option value="">Seleccionar recurso...</option>
                                        {state.subcontractors
                                            .filter(s => !(selectedProject.assignments || []).some(a => a.subcontractorId === s.id))
                                            .map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)
                                        }
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tope de Horas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                            value={newAssignment.hoursCap}
                                            onChange={e => setNewAssignment({ ...newAssignment, hoursCap: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Periodo</label>
                                        <select
                                            className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                            value={newAssignment.period}
                                            onChange={e => setNewAssignment({ ...newAssignment, period: e.target.value as any })}
                                        >
                                            <option value="monthly">Mensual</option>
                                            <option value="total">Total Proyecto</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newAssignment.subcontractorId}
                                    className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                                >
                                    <Plus size={16} /> Añadir Asignación
                                </button>
                            </form>

                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Recursos Actuales</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {(selectedProject.assignments || []).map(assign => {
                                    const sub = state.subcontractors.find(s => s.id === assign.subcontractorId);
                                    return (
                                        <div key={assign.subcontractorId} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800 dark:text-white">{sub?.name}</p>
                                                <p className="text-xs text-slate-500">Máx: {assign.hoursCap}h ({assign.period === 'monthly' ? 'Mes' : 'Total'})</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveAssignment(assign.subcontractorId)}
                                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )
                                })}
                                {(selectedProject.assignments || []).length === 0 && (
                                    <p className="text-center text-slate-400 text-sm italic py-2">Sin asignaciones.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create/Edit Project */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-800 dark:text-white">
                                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                            </h3>
                            <button onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre del Proyecto</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                    value={projectFormData.name}
                                    onChange={e => setProjectFormData({ ...projectFormData, name: e.target.value })}
                                    placeholder="Ej. Implementación SAP"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cliente</label>
                                <input
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                    value={projectFormData.client}
                                    onChange={e => setProjectFormData({ ...projectFormData, client: e.target.value })}
                                    placeholder="Ej. Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Responsable (Project Manager)</label>
                                <select
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                    value={projectFormData.managerId || ''}
                                    onChange={e => setProjectFormData({ ...projectFormData, managerId: e.target.value })}
                                >
                                    <option value="">-- Asignar Responsable --</option>
                                    {projectManagers.map(pm => (
                                        <option key={pm.uid} value={pm.uid}>{pm.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Presupuesto</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                        value={projectFormData.budget}
                                        onChange={e => setProjectFormData({ ...projectFormData, budget: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Moneda</label>
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                        value={projectFormData.currency}
                                        onChange={e => setProjectFormData({ ...projectFormData, currency: e.target.value })}
                                    >
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium transition-colors"
                            >
                                {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};