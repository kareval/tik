import React, { useMemo } from 'react';
import { AppState, Status } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, AlertCircle, Wallet } from 'lucide-react';

interface DashboardProps {
  state: AppState;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  
  // Calculate summary stats
  const totalSpent = useMemo(() => 
    state.invoices
      .filter(i => i.status === Status.RATIFIED_MGR)
      .reduce((acc, curr) => acc + curr.amount, 0), 
  [state.invoices]);

  const pendingApprovalCount = useMemo(() => 
    state.timeLogs.filter(t => t.status === Status.PENDING).length + 
    state.invoices.filter(i => i.status === Status.PENDING).length,
  [state.timeLogs, state.invoices]);

  const activeProjects = state.projects.length;
  
  // Data for Charts
  const spendByProject = useMemo(() => {
    return state.projects.map(p => {
      const spent = state.invoices
        .filter(i => i.projectId === p.id && i.status === Status.RATIFIED_MGR)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const usagePercentage = p.budget > 0 ? spent / p.budget : 0;
      return {
        name: p.name,
        gastado: spent,
        presupuesto: p.budget,
        // Fill dinámico para alertas
        fill: usagePercentage > 0.8 ? '#EF4444' : '#BE0036'
      };
    });
  }, [state.projects, state.invoices]);

  const statusDistribution = useMemo(() => {
    const counts = {
        [Status.PENDING]: 0,
        [Status.APPROVED_PM]: 0,
        [Status.RATIFIED_MGR]: 0,
        [Status.REJECTED]: 0
    };
    state.timeLogs.forEach(t => counts[t.status]++);
    return Object.keys(counts).map(k => ({ name: k, value: counts[k as Status] }));
  }, [state.timeLogs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ERROR 1 CORREGIDO: StatCard ahora funcionará porque está definido abajo */}
        <StatCard 
          title="Gasto Total (Ratificado)" 
          value={`€${totalSpent.toLocaleString()}`} 
          icon={<Wallet className="text-emerald-600" />} 
          trend="+12% vs mes anterior"
        />
        <StatCard 
          title="Pendientes Aprobación" 
          value={pendingApprovalCount.toString()} 
          icon={<AlertCircle className="text-amber-600" />} 
          className="border-amber-200 bg-amber-50"
        />
        <StatCard 
          title="Proyectos Activos" 
          value={activeProjects.toString()} 
          icon={<TrendingUp className="text-indigo-600" />} 
        />
        <StatCard 
          title="Subcontratados" 
          value={state.subcontractors.length.toString()} 
          icon={<Users className="text-indigo-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ejecución Presupuestaria por Proyecto</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByProject}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f1f5f9'}}
                />
                {/* ERROR 2 CORREGIDO: 'radius' movido de Cell a Bar */}
                <Bar dataKey="gastado" name="Gasto Actual" radius={[4, 4, 0, 0]}>
                    {spendByProject.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
                <Bar dataKey="presupuesto" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Presupuesto Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado de Imputaciones</h3>
          <div className="h-80 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4">
             {statusDistribution.map((item, idx) => (
                 <div key={item.name} className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length]}}></div>
                         <span className="text-slate-600 capitalize">{item.name.replace('_', ' ').toLowerCase()}</span>
                     </div>
                     <span className="font-semibold text-slate-900">{item.value}</span>
                 </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ERROR 1 CORREGIDO: Definición del componente StatCard añadida
const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode, trend?: string, className?: string}> = ({title, value, icon, trend, className}) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between ${className}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
                {icon}
            </div>
        </div>
        {trend && <p className="text-xs text-emerald-600 font-medium mt-4">{trend}</p>}
    </div>
);