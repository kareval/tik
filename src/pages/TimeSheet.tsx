import React, { useState, useMemo } from 'react';
import { AppState, Role, Status, TimeLog, Action } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Clock, Search, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Save, Eye, EyeOff,
  Plus, Trash2, AlertCircle, CheckCircle, XCircle,
  User, Briefcase
} from 'lucide-react';

interface TimeSheetProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

// Festivos fijos (Mes-Día)
const FIXED_HOLIDAYS = [
  '01-01', // Año Nuevo
  '01-06', // Reyes
  '05-01', // Día del Trabajo
  '08-15', // Asunción
  '10-12', // Fiesta Nacional
  '11-01', // Todos los Santos
  '12-06', // Constitución
  '12-08', // Inmaculada
  '12-25', // Navidad
];

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

interface TimesheetRow {
  id: string;
  projectId: string;
  description: string;
  hours: string[];
}

type ViewMode = 'week' | 'month' | 'quarter' | 'year' | 'all';

const getQuarter = (d: Date) => Math.floor(d.getMonth() / 3) + 1;

const getStartOfPeriod = (date: Date, mode: ViewMode): Date => {
  const d = new Date(date);
  if (mode === 'week') {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  if (mode === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (mode === 'quarter') {
    const q = getQuarter(d);
    return new Date(d.getFullYear(), (q - 1) * 3, 1);
  }
  if (mode === 'year') return new Date(d.getFullYear(), 0, 1);
  return d;
};

const getEndOfPeriod = (date: Date, mode: ViewMode): Date => {
  const d = new Date(date);
  if (mode === 'week') {
    const start = getStartOfPeriod(date, 'week');
    return new Date(start.setDate(start.getDate() + 6));
  }
  if (mode === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  if (mode === 'quarter') {
    const q = getQuarter(d);
    return new Date(d.getFullYear(), q * 3, 0);
  }
  if (mode === 'year') return new Date(d.getFullYear(), 11, 31);
  return d;
};

const addPeriod = (date: Date, mode: ViewMode, amount: number): Date => {
  const d = new Date(date);
  if (mode === 'week') d.setDate(d.getDate() + (amount * 7));
  if (mode === 'month') d.setMonth(d.getMonth() + amount);
  if (mode === 'quarter') d.setMonth(d.getMonth() + (amount * 3));
  if (mode === 'year') d.setFullYear(d.getFullYear() + amount);
  return d;
};

export const TimeSheet: React.FC<TimeSheetProps> = ({ state, dispatch }) => {
  const [filter, setFilter] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

  // false = Ver todo (Natural), true = Ocultar fines de semana (Laboral)
  const [hideNonWorkingDays, setHideNonWorkingDays] = useState(false);

  const [rows, setRows] = useState<TimesheetRow[]>([
    { id: '1', projectId: '', description: '', hours: Array(7).fill('') }
  ]);

  const canApprove = state.currentUserRole === Role.PROJECT_MANAGER;
  const canRatify = state.currentUserRole === Role.DIRECTOR;
  const isSubcontractor = state.currentUserRole === Role.SUBCONTRACTOR;

  const weekDates = useMemo(() => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const checkFixedHoliday = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const formatted = `${month}-${day}`;
    return FIXED_HOLIDAYS.includes(formatted);
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const dailyTotals = useMemo(() => {
    const totals = Array(7).fill(0);
    rows.forEach(row => {
      row.hours.forEach((h, idx) => {
        totals[idx] += Number(h) || 0;
      });
    });
    return totals;
  }, [rows]);

  const getRowTotal = (hours: string[]) => hours.reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), projectId: '', description: '', hours: Array(7).fill('') }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    } else {
      setRows([{ id: Date.now().toString(), projectId: '', description: '', hours: Array(7).fill('') }]);
    }
  };

  const updateRow = (id: string, field: keyof TimesheetRow, value: any, dayIndex?: number) => {
    setRows(rows.map(row => {
      if (row.id !== id) return row;
      if (field === 'hours' && dayIndex !== undefined) {
        const newHours = [...row.hours];
        if (value === '' || (Number(value) >= 0 && Number(value) <= 24)) {
          newHours[dayIndex] = value;
        }
        return { ...row, hours: newHours };
      }
      return { ...row, [field]: value };
    }));
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentWeekStart(newDate);
    // Mantenemos los datos de las filas al cambiar de semana por comodidad,
    // o podrías resetear con: setRows(...)
    setRows(rows.map(r => ({ ...r, hours: Array(7).fill('') })));
  };

  const handleSaveGrid = () => {
    const newLogs: TimeLog[] = [];
    let hasErrors = false;

    const currentSubcontractor = state.subcontractors.find(s => s.role === Role.SUBCONTRACTOR) || state.subcontractors[0];
    const actualSubId = currentSubcontractor?.id || 's1';

    rows.forEach((row) => {
      const hasHours = row.hours.some(h => Number(h) > 0);
      if (!hasHours) return;

      if (!row.projectId || !row.description) {
        hasErrors = true;
        return;
      }

      row.hours.forEach((h, dayIndex) => {
        const val = Number(h);
        if (val > 0) {
          const dateStr = weekDates[dayIndex].toISOString().split('T')[0];
          newLogs.push({
            id: Date.now().toString() + Math.random(),
            subcontractorId: actualSubId,
            projectId: row.projectId,
            date: dateStr,
            hours: val,
            description: row.description,
            status: Status.PENDING
          });
        }
      });
    });

    if (hasErrors) {
      alert("Completa Proyecto y Descripción para las filas con horas.");
      return;
    }

    if (newLogs.length > 0) {
      dispatch({ type: 'BATCH_ADD_TIMELOGS', payload: newLogs });
      alert(`${newLogs.length} registros guardados.`);
      setRows([{ id: Date.now().toString(), projectId: '', description: '', hours: Array(7).fill('') }]);
    } else {
      alert("No hay horas para guardar.");
    }
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    dispatch({ type: 'UPDATE_TIMELOG_STATUS', payload: { id, status: newStatus } });
  };

  // Lógica para mostrar el consumo en el selector de proyectos
  const getProjectStatusLabel = (projectId: string) => {
    if (!isSubcontractor) return '';

    const currentSub = state.subcontractors.find(s => s.role === Role.SUBCONTRACTOR) || state.subcontractors[0];
    const project = state.projects.find(p => p.id === projectId);
    const assignment = project?.assignments?.find(a => a.subcontractorId === currentSub?.id);

    if (assignment) {
      // Cálculo simple de consumo total para demo
      const logs = state.timeLogs.filter(l => l.projectId === projectId && l.subcontractorId === currentSub?.id);
      const consumed = logs.reduce((sum, l) => sum + l.hours, 0);
      return ` (Restan: ${(assignment.hoursCap - consumed).toFixed(0)}h)`;
    }
    return '';
  };

  // State for filtering and grouping
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'subcontractor'>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [historyDate, setHistoryDate] = useState(new Date());

  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const toggleGroupBy = (mode: 'none' | 'project' | 'subcontractor') => {
    setGroupBy(prev => prev === mode ? 'none' : mode);
  };

  const weekStrings = useMemo(() => weekDates.map(d => d.toISOString().split('T')[0]), [weekDates]);

  const filteredLogs = useMemo(() => {
    const start = getStartOfPeriod(historyDate, viewMode);
    const end = getEndOfPeriod(historyDate, viewMode);
    // Ajustar end para cubrir todo el día (hasta 23:59:59 si comparamos timestamps, pero aquí comparamos strings YYYY-MM-DD)
    // Basic string comparison works if format is YYYY-MM-DD
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    return state.timeLogs.filter(log => {
      // Text Filter
      const subName = state.subcontractors.find(s => s.id === log.subcontractorId)?.name.toLowerCase() || '';
      const projName = state.projects.find(p => p.id === log.projectId)?.name.toLowerCase() || '';
      const matchesText = subName.includes(filter.toLowerCase()) || projName.includes(filter.toLowerCase());

      if (!matchesText) return false;

      // Period Filter
      if (viewMode !== 'all') {
        if (log.date < startStr || log.date > endStr) return false;
      }

      // Advanced Filters
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (projectFilter !== 'all' && log.projectId !== projectFilter) return false;
      if (resourceFilter !== 'all' && log.subcontractorId !== resourceFilter) return false;

      return true;
    });
  }, [state.timeLogs, filter, viewMode, historyDate, state.subcontractors, state.projects, statusFilter, projectFilter, resourceFilter]);

  // Filter logs for approval
  const activeLogs = useMemo(() => {
    let logs = state.timeLogs.filter(log => log.status !== Status.PENDING && log.status !== Status.REJECTED);

    // If specific statuses for PM vs Director, filter here.
    // For now, assuming PM sees everything submitted (PENDING usually, but here 'activeLogs' implies history/processed?)
    // Actually, traditionally 'activeLogs' in this component seemed to be "History of Approvals" or similar?
    // Let's re-read the context. The "TimeSheet" has "Pending Approvals" and "Approval History".
    // We should filter BOTH based on managerEmail.

    // Filter by Manager Email if user is PM/Director
    if ((state.currentUserRole === Role.PROJECT_MANAGER || state.currentUserRole === Role.DIRECTOR) && state.currentUserEmail) {
      logs = logs.filter(log => {
        const sub = state.subcontractors.find(s => s.id === log.subcontractorId);
        return sub?.managerEmail === state.currentUserEmail;
      });
    }

    return logs;
  }, [state.timeLogs, state.subcontractors, state.currentUserRole, state.currentUserEmail]);

  // Pending Approvals (Only for PM/Director)
  const pendingApprovals = useMemo(() => {
    let logs = state.timeLogs.filter(log => log.status === Status.PENDING);

    if ((state.currentUserRole === Role.PROJECT_MANAGER || state.currentUserRole === Role.DIRECTOR) && state.currentUserEmail) {
      logs = logs.filter(log => {
        const sub = state.subcontractors.find(s => s.id === log.subcontractorId);
        // If no manager assigned, maybe show to all? Or none? 
        // Let's safe fail: if no manager email on sub, show to none (or maybe all if we want to be permissive). 
        // Request said: "solo deben aparecer aquellos recursos que dependen del usuario".
        return sub?.managerEmail === state.currentUserEmail;
      });
    }

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.timeLogs, state.subcontractors, state.currentUserRole, state.currentUserEmail]);

  // Grouping Logic
  const groupedLogs = useMemo(() => {
    if (groupBy === 'none') return { 'All': filteredLogs };

    const groups: Record<string, TimeLog[]> = {};

    filteredLogs.forEach(log => {
      let key = '';
      if (groupBy === 'project') {
        key = state.projects.find(p => p.id === log.projectId)?.name || 'Sin Proyecto';
      } else {
        key = state.subcontractors.find(s => s.id === log.subcontractorId)?.name || 'Desconocido';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    return groups;
  }, [filteredLogs, groupBy, state.projects, state.subcontractors]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Control de Horas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Imputación semanal por proyecto.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar historial..."
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-64 transition-colors"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isSubcontractor && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
              <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
              <div className="px-4 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[220px] justify-center">
                <CalendarIcon size={16} className="text-brand-600 mb-0.5" />
                {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
              </div>
              <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight size={18} /></button>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <button
                onClick={() => setHideNonWorkingDays(!hideNonWorkingDays)}
                className={`text-xs flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors font-medium ${!hideNonWorkingDays
                  ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                  : 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-800'
                  }`}
              >
                {hideNonWorkingDays ? <EyeOff size={16} /> : <Eye size={16} />}
                {hideNonWorkingDays ? 'Mostrar Todo' : 'Ocultar No Laborables'}
              </button>

              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

              <button
                onClick={addRow}
                className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> Añadir Fila
              </button>
              <button
                onClick={handleSaveGrid}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors shadow-md shadow-brand-900/20 flex items-center gap-2"
              >
                <Save size={18} /> Guardar Todo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="px-4 py-3 w-64">Proyecto</th>
                  <th className="px-4 py-3 w-64">Descripción</th>
                  {weekDates.map((date, i) => {
                    const isWknd = isWeekend(date);
                    const isHol = checkFixedHoliday(date);

                    // Lógica: Si está activo "ocultar", escondemos sábados y domingos
                    if (hideNonWorkingDays && isWknd) return null;

                    // Estilos especiales
                    // Festivo siempre se marca. Finde se marca solo si es visible.
                    const isSpecial = isHol;

                    return (
                      <th key={i} className={`px-2 py-3 text-center w-16 border-l border-slate-100 dark:border-slate-800 ${isSpecial ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-500' : isWknd ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : ''}`}>
                        <div className="flex flex-col items-center">
                          <span className="uppercase text-[10px]">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                          <span className={`text-lg leading-none ${isSpecial ? 'font-bold' : ''}`}>{date.getDate()}</span>
                          {isHol && <span className="text-[8px] font-bold uppercase mt-1 text-amber-600 dark:text-amber-400">Festivo</span>}
                        </div>
                      </th>
                    )
                  })}
                  <th className="px-4 py-3 w-16 text-center">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-2">
                      <select
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-brand-500 outline-none dark:text-white text-sm"
                        value={row.projectId}
                        onChange={(e) => updateRow(row.id, 'projectId', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        {state.projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name} {getProjectStatusLabel(p.id)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-brand-500 outline-none dark:text-white text-sm"
                        placeholder="Tarea realizada..."
                        value={row.description}
                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                      />
                    </td>
                    {weekDates.map((date, dayIndex) => {
                      const isWknd = isWeekend(date);
                      const isHol = checkFixedHoliday(date);

                      if (hideNonWorkingDays && isWknd) return null;

                      const isSpecial = isHol;

                      return (
                        <td key={dayIndex} className={`p-1 border-l border-slate-100 dark:border-slate-800 ${isSpecial ? 'bg-amber-50/50 dark:bg-amber-900/5' : isWknd ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="-"
                            className={`w-full h-9 text-center bg-transparent border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-brand-500 border rounded outline-none font-mono ${row.hours[dayIndex] ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-400'
                              } ${isSpecial ? 'placeholder-amber-300 dark:placeholder-amber-800' : ''}`}
                            value={row.hours[dayIndex]}
                            onChange={(e) => updateRow(row.id, 'hours', e.target.value, dayIndex)}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/50">
                      {getRowTotal(row.hours) || '-'}
                    </td>
                    <td className="px-2 text-center">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                        title="Eliminar fila"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-600 font-bold text-xs uppercase text-slate-600 dark:text-slate-300">
                  <td colSpan={2} className="px-4 py-3 text-right">Totales Diarios:</td>
                  {dailyTotals.map((total, i) => {
                    if (hideNonWorkingDays && isWeekend(weekDates[i])) return null;
                    return (
                      <td key={i} className={`text-center py-2 ${total > 8 ? 'text-red-600 dark:text-red-400' : total === 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {total > 0 ? total + 'h' : '-'}
                      </td>
                    )
                  })}
                  <td className="text-center py-2 text-brand-600 dark:text-brand-400 text-sm">
                    {dailyTotals.reduce((a, b) => a + b, 0)}h
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial y Aprobaciones */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-slate-400" />
                {(canApprove || canRatify) ? 'Aprobaciones y Registros' : 'Historial de Registros'}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                {filteredLogs.length} entradas
              </span>
            </div>

            {(canApprove || canRatify) && (
              <div className="flex flex-col xl:flex-row items-end xl:items-center gap-3">
                {/* Period Navigation */}
                {viewMode !== 'all' && (
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-sm mr-2">
                    <button onClick={() => setHistoryDate(addPeriod(historyDate, viewMode, -1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400"><ChevronLeft size={16} /></button>
                    <span className="px-3 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 min-w-[140px] text-center">
                      {viewMode === 'week' && `${getStartOfPeriod(historyDate, 'week').toLocaleDateString()} - ${getEndOfPeriod(historyDate, 'week').toLocaleDateString()}`}
                      {viewMode === 'month' && historyDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      {viewMode === 'quarter' && `Q${getQuarter(historyDate)} ${historyDate.getFullYear()}`}
                      {viewMode === 'year' && historyDate.getFullYear()}
                    </span>
                    <button onClick={() => setHistoryDate(addPeriod(historyDate, viewMode, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400"><ChevronRight size={16} /></button>
                  </div>
                )}

                {/* View Mode Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                  {(['week', 'month', 'quarter', 'year', 'all'] as ViewMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    >
                      {mode === 'week' ? 'Semana' : mode === 'month' ? 'Mes' : mode === 'quarter' ? 'Trim.' : mode === 'year' ? 'Año' : 'Todo'}
                    </button>
                  ))}
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => toggleGroupBy('subcontractor')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${groupBy === 'subcontractor' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    title="Agrupar por Recurso"
                  >
                    <User size={14} />
                  </button>
                  <button
                    onClick={() => toggleGroupBy('project')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${groupBy === 'project' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                    title="Agrupar por Proyecto"
                  >
                    <Briefcase size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase text-slate-400">Filtrar por:</span>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="all">Estado: Todos</option>
              <option value={Status.PENDING}>Pendiente</option>
              <option value={Status.APPROVED_PM}>Aprobado PM</option>
              <option value={Status.RATIFIED_MGR}>Ratificado</option>
              <option value={Status.REJECTED}>Rechazado</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none max-w-[150px]"
            >
              <option value="all">Proyecto: Todos</option>
              {state.projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Resource Filter */}
            {!isSubcontractor && (
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none max-w-[150px]"
              >
                <option value="all">Recurso: Todos</option>
                {state.subcontractors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {/* Clear Filters Button */}
            {(statusFilter !== 'all' || projectFilter !== 'all' || resourceFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setProjectFilter('all');
                  setResourceFilter('all');
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline ml-auto"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-sm">
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                <th className="px-6 py-3">Fecha</th>
                {groupBy !== 'subcontractor' && <th className="px-6 py-3">Subcontratado</th>}
                {groupBy !== 'project' && <th className="px-6 py-3">Proyecto</th>}
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3 text-center">Horas</th>
                <th className="px-6 py-3">Estado</th>
                {(canApprove || canRatify) && <th className="px-6 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {Object.entries(groupedLogs).map(([groupKey, logs]) => (
                <React.Fragment key={groupKey}>
                  {groupBy !== 'none' && (
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <td colSpan={8} className="px-6 py-2 font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                        {groupKey} ({logs.reduce((acc, l) => acc + l.hours, 0)}h)
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">{log.date}</td>
                      {groupBy !== 'subcontractor' && (
                        <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {state.subcontractors.find(s => s.id === log.subcontractorId)?.name}
                        </td>
                      )}
                      {groupBy !== 'project' && (
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                          {state.projects.find(p => p.id === log.projectId)?.name}
                        </td>
                      )}
                      <td className="px-6 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.description}>{log.description}</td>
                      <td className="px-6 py-3 text-center font-mono font-medium">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-200">
                          {log.hours}h
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                      {(canApprove || canRatify) && (
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canApprove && log.status === Status.PENDING && (
                              <>
                                <ActionBtn onClick={() => handleStatusChange(log.id, Status.APPROVED_PM)} type="approve" />
                                <ActionBtn onClick={() => handleStatusChange(log.id, Status.REJECTED)} type="reject" />
                              </>
                            )}
                            {canRatify && log.status === Status.APPROVED_PM && (
                              <>
                                <ActionBtn onClick={() => handleStatusChange(log.id, Status.RATIFIED_MGR)} type="ratify" />
                                <ActionBtn onClick={() => handleStatusChange(log.id, Status.REJECTED)} type="reject" />
                              </>
                            )}
                            {((canApprove && log.status !== Status.PENDING) || (canRatify && log.status !== Status.APPROVED_PM)) && (
                              <span className="text-slate-300 dark:text-slate-600 text-[10px] uppercase italic">Sin acciones</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {Object.keys(groupedLogs).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 dark:text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle size={40} className="opacity-20" />
                      <p>No hay registros que coincidan con los filtros.</p>
                    </div>
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

const ActionBtn: React.FC<{ onClick: () => void, type: 'approve' | 'reject' | 'ratify' }> = ({ onClick, type }) => {
  let classes = "p-1.5 rounded hover:bg-opacity-80 transition ";
  let icon;
  let title;

  if (type === 'approve') {
    classes += "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50";
    icon = <CheckCircle size={16} />;
    title = "Aprobar (Jefe Proyecto)";
  } else if (type === 'ratify') {
    classes += "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50";
    icon = <CheckCircle size={16} />;
    title = "Ratificar (Responsable)";
  } else {
    classes += "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50";
    icon = <XCircle size={16} />;
    title = "Rechazar";
  }

  return (
    <button onClick={onClick} className={classes} title={title}>
      {icon}
    </button>
  )
}