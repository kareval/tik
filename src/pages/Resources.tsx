import React, { useState } from 'react';
import { AppState, Action, Subcontractor, Role } from '../types';
import { Search, Plus, Edit2, X, User, Briefcase, DollarSign } from 'lucide-react';

interface ResourcesProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const Resources: React.FC<ResourcesProps> = ({ state, dispatch }) => {
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Subcontractor>({
    id: '',
    name: '',
    role: '',
    hourlyRate: 0,
    currency: 'EUR'
  });

  const filteredSubs = state.subcontractors.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.role.toLowerCase().includes(filter.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ id: '', name: '', role: '', hourlyRate: 0, currency: 'EUR' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subcontractor) => {
    setEditMode(true);
    setFormData(sub);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) {
      dispatch({ type: 'UPDATE_SUBCONTRACTOR', payload: formData });
    } else {
      dispatch({ type: 'ADD_SUBCONTRACTOR', payload: { ...formData, id: Date.now().toString() } });
    }
    setIsModalOpen(false);
  };

  const handleSync = async () => {
    // Dynamic import integration service to use its static method
    const { IntegrationService } = await import('../services/integrationService');
    const res = await IntegrationService.syncData();
    if (res.success) alert('Sincronización de recursos y tiempos completada.');
    else alert('Error en sincronización: ' + res.error);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Recursos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Administra los subcontratados y sus tarifas.</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleSync}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center gap-2"
            title="Sincronizar con Factorial HR"
          >
            🔄 Sincronizar
          </button>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar recurso..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none transition-colors"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubs.map(sub => (
          <div key={sub.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4 transition-all hover:shadow-md relative">
            {sub.personnelNumber && (
              <div className="absolute top-4 right-12 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs" title="Nº Personal">
                #{sub.personnelNumber}
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {sub.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{sub.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sub.role}</p>
                  {sub.managerEmail && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">PM: {sub.managerEmail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleOpenEdit(sub)}
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2 flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">Tarifa Hora</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {sub.hourlyRate} <span className="text-xs font-normal text-slate-400">{sub.currency}/h</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">{editMode ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Rol / Puesto</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tarifa Hora</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                      value={formData.hourlyRate}
                      onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Moneda</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-lg font-medium transition-colors">
                  Guardar Recurso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};