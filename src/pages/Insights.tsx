import React, { useState } from 'react';
import { AppState } from '../types';
import { analyzeProjectHealth } from '../services/geminiService';
import { Sparkles, FileText, RefreshCw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface InsightsProps {
  state: AppState;
}

export const Insights: React.FC<InsightsProps> = ({ state }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await analyzeProjectHealth(state);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="text-center space-y-4">
           <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-full text-indigo-600 mb-2">
               <Sparkles size={32} />
           </div>
           <h2 className="text-3xl font-bold text-slate-900">Auditoría Inteligente</h2>
           <p className="text-slate-500 max-w-lg mx-auto">
               Utiliza Gemini AI para analizar en tiempo real el rendimiento de tus subcontratados, 
               detectar desviaciones presupuestarias y generar recomendaciones estratégicas.
           </p>
           
           <button 
             onClick={handleGenerateReport}
             disabled={loading}
             className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />}
             Generar Informe Ejecutivo
           </button>
       </div>

       {report && (
           <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up">
               <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center gap-3">
                   <FileText className="text-slate-400" />
                   <h3 className="font-semibold text-slate-700">Informe Generado</h3>
                   <span className="text-xs ml-auto text-slate-400">Generado con Gemini 2.5 Flash</span>
               </div>
               <div className="p-8 prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-indigo-600">
                   <ReactMarkdown>{report}</ReactMarkdown>
               </div>
           </div>
       )}

       {/* Features Grid */}
       {!report && !loading && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
               <FeatureBox 
                 title="Detección de Riesgos" 
                 desc="Identifica facturación inusual o exceso de horas antes de que impacte en el margen."
               />
               <FeatureBox 
                 title="Resumen de Proyecto" 
                 desc="Obtén el estado de salud de múltiples proyectos en segundos."
               />
               <FeatureBox 
                 title="Soporte a la Decisión" 
                 desc="Recomendaciones basadas en datos para aprobar o rechazar gastos."
               />
           </div>
       )}
    </div>
  );
};

const FeatureBox: React.FC<{title: string, desc: string}> = ({title, desc}) => (
    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all">
        <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
    </div>
);