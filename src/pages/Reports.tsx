import React, { useState, useMemo } from 'react';
import { AppState, Status } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Calendar, Filter, Download, Briefcase, User, Layers, DollarSign } from 'lucide-react';

interface ReportsProps {
  state: AppState;
}

type ReportTab = 'hours' | 'financial';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

export const Reports: React.FC<ReportsProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('hours');
  
  // Filter States
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // --- Derived Data Logic ---

  // 1. Filter Data
  const filteredTimeLogs = useMemo(() => {
    return state.timeLogs.filter(log => {
      const matchProject = selectedProject === 'all' || log.projectId === selectedProject;
      const matchSub = selectedSub === 'all' || log.subcontractorId === selectedSub;
      const matchStart = !startDate || log.date >= startDate;
      const matchEnd = !endDate || log.date <= endDate;
      return matchProject && matchSub && matchStart && matchEnd;
    });
  }, [state.timeLogs, selectedProject, selectedSub, startDate, endDate]);

  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(inv => {
      const matchProject = selectedProject === 'all' || inv.projectId === selectedProject;
      const matchSub = selectedSub === 'all' || inv.subcontractorId === selectedSub;
      // Note: Invoices use 'period' (YYYY-MM), simplified filter by period string comparison
      return matchProject && matchSub;
    });
  }, [state.invoices, selectedProject, selectedSub]);

  // 2. Aggregate Data for Charts

  // Chart: Hours per Project
  const hoursByProject = useMemo(() => {
    const map = new Map<string, number>();
    filteredTimeLogs.forEach(log => {
      const pName = state.projects.find(p => p.id === log.projectId)?.name || 'Unknown';
      map.set(pName, (map.get(pName) || 0) + log.hours);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredTimeLogs, state.projects]);

  // Chart: Cost per Project (Financial)
  const costByProject = useMemo(() => {
      const map = new Map<string, number>();
      filteredInvoices.forEach(inv => {
          const pName = state.projects.find(p => p.id === inv.projectId)?.name || 'Unknown';
          map.set(pName, (map.get(pName) || 0) + inv.amount);
      });
      return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices, state.projects]);

  // Chart: Activity over Time (Daily)
  const activityOverTime = useMemo(() => {
    const map = new Map<string, number>();
    // Sort logs by date first
    const sortedLogs = [...filteredTimeLogs].sort((a, b) => a.date.localeCompare(b.date));
    sortedLogs.forEach(log => {
        map.set(log.date, (map.get(log.date) || 0) + log.hours);
    });
    return Array.from(map.entries()).map(([date, hours]) => ({ date, hours }));
  }, [filteredTimeLogs]);

  // KPIs
  const totalHours = filteredTimeLogs.reduce((acc, curr) => acc + curr.hours, 0);
  const totalCost = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);
  const approvedRate = filteredTimeLogs.length > 0 
    ? (filteredTimeLogs.filter(t => t.status === Status.APPROVED_PM || t.status === Status.RATIFIED_MGR).length / filteredTimeLogs.length) * 100
    : 0;

  const handleExport = () => {
      alert("Simulación: Reporte exportado a CSV/PDF exitosamente.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Centro de Informes</h2>
          <p className="text-slate-500 text-sm">Genera reportes detallados y visualiza métricas clave.</p>
        </div>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
            <Download size={16} /> Exportar Datos
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold text-sm uppercase tracking-wide">
              <Filter size={16} /> Filtros de Configuración
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Proyecto</label>
                  <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-600"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                      >
                          <option value="all">Todos los proyectos</option>
                          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Subcontratista</label>
                  <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <select 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-600"
                        value={selectedSub}
                        onChange={(e) => setSelectedSub(e.target.value)}
                      >
                          <option value="all">Todos los recursos</option>
                          {state.subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                  <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input 
                        type="date" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-600"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                  <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input 
                        type="date" 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-600"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
          <nav className="-mb-px flex gap-6">
              <button
                onClick={() => setActiveTab('hours')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'hours'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                  <Layers size={18} /> Análisis de Horas
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === 'financial'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                  <DollarSign size={18} /> Análisis Financiero
              </button>
          </nav>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTab === 'hours' ? (
              <>
                <KpiCard label="Horas Totales" value={totalHours.toString()} sub="En periodo seleccionado" color="blue" />
                <KpiCard label="Registros" value={filteredTimeLogs.length.toString()} sub="Entradas individuales" color="indigo" />
                <KpiCard label="Tasa Aprobación" value={`${approvedRate.toFixed(1)}%`} sub="Horas validadas" color="emerald" />
              </>
          ) : (
              <>
                <KpiCard label="Total Facturado" value={`€${totalCost.toLocaleString()}`} sub="Importe neto" color="emerald" />
                <KpiCard label="Facturas" value={filteredInvoices.length.toString()} sub="Documentos procesados" color="blue" />
                <KpiCard label="Coste Promedio" value={filteredInvoices.length ? `€${(totalCost / filteredInvoices.length).toFixed(0)}` : '€0'} sub="Por factura" color="amber" />
              </>
          )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'hours' ? (
              <>
                <ChartCard title="Distribución por Proyecto">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hoursByProject} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Actividad Diaria">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={activityOverTime}>
                            <defs>
                                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{fontSize: 11}} tickFormatter={(val) => val.substring(5)} />
                            <YAxis tick={{fontSize: 11}} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                            <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHours)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
              </>
          ) : (
             <>
                <ChartCard title="Coste por Proyecto">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={costByProject}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {costByProject.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Detalle Financiero">
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={costByProject}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={false} />
                            <YAxis tick={{fontSize: 11}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} formatter={(value) => `€${value.toLocaleString()}`} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
             </>
          )}
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">
                  {activeTab === 'hours' ? 'Detalle de Imputaciones' : 'Detalle de Facturación'}
              </h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200 text-slate-500">
                      <tr>
                          <th className="px-6 py-3 font-medium">Fecha / Periodo</th>
                          <th className="px-6 py-3 font-medium">Proyecto</th>
                          <th className="px-6 py-3 font-medium">Recurso</th>
                          <th className="px-6 py-3 font-medium text-right">
                              {activeTab === 'hours' ? 'Horas' : 'Importe'}
                          </th>
                          <th className="px-6 py-3 font-medium text-center">Estado</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {activeTab === 'hours' ? (
                          filteredTimeLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 text-slate-600 font-mono">{log.date}</td>
                                  <td className="px-6 py-4 text-slate-800 font-medium">
                                      {state.projects.find(p => p.id === log.projectId)?.name}
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">
                                      {state.subcontractors.find(s => s.id === log.subcontractorId)?.name}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-brand-600">{log.hours}</td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`text-xs px-2 py-1 rounded-full border ${
                                          log.status === 'APPROVED_PM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          log.status === 'RATIFIED_MGR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          'bg-gray-50 text-gray-600 border-gray-200'
                                      }`}>
                                          {log.status}
                                      </span>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          filteredInvoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 text-slate-600 font-mono">{inv.period}</td>
                                  <td className="px-6 py-4 text-slate-800 font-medium">
                                      {state.projects.find(p => p.id === inv.projectId)?.name}
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">
                                      {state.subcontractors.find(s => s.id === inv.subcontractorId)?.name}
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-emerald-600">€{inv.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">
                                       <span className={`text-xs px-2 py-1 rounded-full border ${
                                          inv.status === 'APPROVED_PM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          inv.status === 'RATIFIED_MGR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          'bg-gray-50 text-gray-600 border-gray-200'
                                      }`}>
                                          {inv.status}
                                      </span>
                                  </td>
                              </tr>
                          ))
                      )}
                      {(activeTab === 'hours' ? filteredTimeLogs : filteredInvoices).length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                  No hay datos que coincidan con los filtros seleccionados.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{label: string, value: string, sub: string, color: 'blue'|'indigo'|'emerald'|'amber'}> = ({label, value, sub, color}) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600'
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
            <div className="flex items-end gap-3">
                <span className={`text-3xl font-bold text-slate-900`}>{value}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{sub}</p>
        </div>
    );
};

const ChartCard: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-6">{title}</h3>
        {children}
    </div>
);