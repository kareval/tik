import React, { useState, useEffect } from 'react';
import { subscribeToCollection, addItem, updateItem } from '../services/firestore';
import { AppState } from '../types';

interface SettingsProps {
    state: AppState;
}

export const Settings: React.FC<SettingsProps> = ({ state }) => {
    const [apiKey, setApiKey] = useState('eyJraWQiOiJmYWN0b3JpYWwtaWQiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE3NjU5ODA2NzIsImV4cCI6MjA4MTU1MDE5MiwianRpIjoiZGM3ZTdmNzYtYjU0ZS00YjJhLTk1YzctZDA0NDllMTA0MTA1IiwiY2VsbCI6ImF3cy1wcm9kLWV1Y2VudHJhbDEtZ2xvYjAxIiwiY29tcGFueV9pZCI6MzQ1ODAwfQ.REnDpWOJ_lNoxpkifZn6EC73rwJ3dVFdTI5Gfa77bg4_HLvO5srWmBmvbrcmE7UqLb8WFBk7exdmfIMQNHd9iA');
    const [isEnabled, setIsEnabled] = useState(false);
    const [docId, setDocId] = useState<string | null>(null);
    const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');

    useEffect(() => {
        // Subscribe to settings/integration document
        const unsubscribe = subscribeToCollection('settings', (data: any[]) => {
            const config = data.find(d => d.id === 'factorial');
            if (config) {
                // If saved API Key exists, use it. Otherwise keep default.
                if (config.apiKey) setApiKey(config.apiKey);
                setIsEnabled(config.enabled || false);
                setDocId(config.id);
                // Connected if apiKey is present (either saved or default)
                if (config.apiKey || apiKey) setStatus('CONNECTED');
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        const data = {
            apiKey,
            enabled: isEnabled,
        };

        if (docId) {
            await updateItem('settings', docId, data);
        } else {
            await addItem('settings', { id: 'factorial', ...data });
        }
        alert('Configuración guardada.');
    };

    // OAuth connect handler removed


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configuración</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Integraciones</h2>

                <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🤝</span>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">Factorial HR</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {status === 'CONNECTED' ? 'CONECTADO' : 'DESCONECTADO'}
                            </span>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isEnabled}
                                    onChange={(e) => setIsEnabled(e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Sincroniza empleados y registros de tiempo automáticamente.
                    </p>

                    {isEnabled && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>Modo API Key:</strong> Se utilizará una API Key estática en lugar de OAuth.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Factorial API Key</label>
                                <textarea
                                    rows={3}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 font-mono text-xs"
                                    placeholder="eyJ..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Clave proporcionada manualmente.</p>
                            </div>

                            <div className="flex space-x-3 mt-2">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                                >
                                    Guardar Configuración
                                </button>
                            </div>

                            {/* Sync Button is always available if Key is present */}
                            {(apiKey || status === 'CONNECTED') && (
                                <div className="mt-4 border-t pt-4">
                                    <button
                                        onClick={async () => {
                                            const { IntegrationService } = await import('../services/integrationService'); // Dynamic import to avoid circular dep if any
                                            const res = await IntegrationService.syncData();
                                            if (res.success) alert('Sincronización completada.');
                                            else alert('Error en sincronización: ' + res.error);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm"
                                    >
                                        🔄 Sincronizar Datos Ahora
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Zona de Peligro</h3>
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4">
                            <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                                Esta acción eliminará permanentemente todos los datos de negocio (Proyectos, Tareas, Recursos, Facturas).
                                No afectará a usuarios ni roles. Úsalo para reiniciar la sincronización.
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('¿ESTÁS SEGURO? Se borrarán TODOS los proyectos y registros de tiempo. Esta acción es irreversible.')) {
                                        if (confirm('¿De verdad? Confirma una vez más.')) {
                                            const { clearCollection } = await import('../services/firestore');
                                            await clearCollection('projects');
                                            await clearCollection('timeLogs');
                                            await clearCollection('subcontractors');
                                            await clearCollection('invoices'); // Just in case
                                            alert('Base de datos reiniciada correctamente.');
                                        }
                                    }
                                }}
                                className="px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none"
                            >
                                🗑️ Borrar Todos los Datos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
