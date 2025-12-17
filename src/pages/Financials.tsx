import React, { useState } from 'react';
import { AppState, Role, Status, Action, Invoice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, CheckCircle, XCircle, Plus, X, AlertTriangle } from 'lucide-react';

interface FinancialsProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const Financials: React.FC<FinancialsProps> = ({ state, dispatch }) => {
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
      projectId: '',
      subcontractorId: '',
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      amount: 0,
      currency: 'EUR',
      status: Status.PENDING
  });

  const canApprove = state.currentUserRole === Role.PROJECT_MANAGER;
  const canRatify = state.currentUserRole === Role.DIRECTOR;

  const handleStatusChange = (id: string, newStatus: Status) => {
    dispatch({ type: 'UPDATE_INVOICE_STATUS', payload: { id, status: newStatus } });
  };

  const handleAddInvoice = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newInvoice.projectId || !newInvoice.subcontractorId || !newInvoice.amount) return;

      const invoice: Invoice = {
          id: Date.now().toString(),
          projectId: newInvoice.projectId,
          subcontractorId: newInvoice.subcontractorId,
          period: newInvoice.period!,
          amount: Number(newInvoice.amount),
          currency: newInvoice.currency || 'EUR',
          status: Status.PENDING
      };

      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      setShowModal(false);
      setNewInvoice({ ...newInvoice, amount: 0 });
  };

  // Función para calcular coste teórico
  const calculateTheoreticalAmount = (invoice: Invoice) => {
      // 1. Buscar tarifa del recurso
      const sub = state.subcontractors.find(s => s.id === invoice.subcontractorId);
      if (!sub) return 0;

      // 2. Buscar horas aprobadas/ratificadas en ese periodo y proyecto
      const logs = state.timeLogs.filter(log => 
          log.projectId === invoice.projectId &&
          log.subcontractorId === invoice.subcontractorId &&
          log.date.startsWith(invoice.period) &&
          (log.status === Status.APPROVED_PM || log.status === Status.RATIFIED_MGR)
      );

      const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
      return totalHours * sub.hourlyRate;
  };

  // Group invoices by project
  const groupedInvoices = state.invoices.reduce((acc, inv) => {
      const projId = inv.projectId;
      if(!acc[projId]) acc[projId] = [];
      acc[projId].push(inv);
      return acc;
  }, {} as Record<string, typeof state.invoices>);

  return (
    <div className="space-y-8 pb-20">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Facturación</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm">Control de facturas y validación vs teórico.</p>
           </div>
           <button 
                onClick={() => setShowModal(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-md flex items-center gap-2"
            >
                <Plus size={18} /> Registrar Factura
            </button>
        </div>

        <div className="grid gap-6">
            {Object.keys(groupedInvoices).map(projId => {
                const project = state.projects.find(p => p.id === projId);
                const invoices = groupedInvoices[projId];

                return (
                    <div key={projId} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{project?.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{project?.client}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400">Total Facturado</span>
                                <p className="font-bold text-slate-700 dark:text-slate-200">
                                    €{invoices.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                                    <tr className="text-slate-500 dark:text-slate-400">
                                        <th className="px-6 py-3 font-medium">Periodo</th>
                                        <th className="px-6 py-3 font-medium">Subcontratado</th>
                                        <th className="px-6 py-3 font-medium text-right">Teórico (Horas)</th>
                                        <th className="px-6 py-3 font-medium text-right">Facturado</th>
                                        <th className="px-6 py-3 font-medium text-right">Desviación</th>
                                        <th className="px-6 py-3 font-medium text-center">Estado</th>
                                        <th className="px-6 py-3 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                                    {invoices.map(inv => {
                                        const sub = state.subcontractors.find(s => s.id === inv.subcontractorId);
                                        const theoretical = calculateTheoreticalAmount(inv);
                                        const deviation = inv.amount - theoretical;
                                        const hasRisk = deviation > 0; // Facturado más que teórico

                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{inv.period}</td>
                                                <td className="px-6 py-4 font-medium">{sub?.name}</td>
                                                <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                                                    €{theoretical.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">
                                                    €{inv.amount.toLocaleString()}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${hasRisk ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    {deviation > 0 ? '+' : ''}€{deviation.toLocaleString()}
                                                    {hasRisk && <AlertTriangle size={12} className="inline ml-1 mb-0.5"/>}
                                                </td>
                                                <td className="px-6 py-4 text-center"><StatusBadge status={inv.status} /></td>
                                                <td className="px-6 py-4 flex items-center justify-end gap-3">
                                                    <button className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors" title="Ver Factura">
                                                        <FileText size={18} />
                                                    </button>
                                                    
                                                    {canApprove && inv.status === Status.PENDING && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleStatusChange(inv.id, Status.APPROVED_PM)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded"><CheckCircle size={18}/></button>
                                                            <button onClick={() => handleStatusChange(inv.id, Status.REJECTED)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><XCircle size={18}/></button>
                                                        </div>
                                                    )}
                                                    {canRatify && inv.status === Status.APPROVED_PM && (
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleStatusChange(inv.id, Status.RATIFIED_MGR)} className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1 rounded" title="Ratificar"><CheckCircle size={18}/></button>
                                                            <button onClick={() => handleStatusChange(inv.id, Status.REJECTED)} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded"><XCircle size={18}/></button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Modal Nueva Factura */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Registrar Factura</h3>
                        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Proyecto</label>
                            <select 
                                required
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                value={newInvoice.projectId}
                                onChange={(e) => setNewInvoice({...newInvoice, projectId: e.target.value})}
                            >
                                <option value="">Seleccionar...</option>
                                {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Subcontratado</label>
                            <select 
                                required
                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                value={newInvoice.subcontractorId}
                                onChange={(e) => setNewInvoice({...newInvoice, subcontractorId: e.target.value})}
                            >
                                <option value="">Seleccionar...</option>
                                {state.subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Periodo (Mes)</label>
                                <input 
                                    type="month"
                                    required
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                    value={newInvoice.period}
                                    onChange={(e) => setNewInvoice({...newInvoice, period: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Importe Total</label>
                                <input 
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 outline-none dark:text-white"
                                    value={newInvoice.amount}
                                    onChange={(e) => setNewInvoice({...newInvoice, amount: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="pt-4">
                            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg font-medium transition-colors">
                                Guardar Factura
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};