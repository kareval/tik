import { AppState } from '../types';

// MOCK implementation - Feature disabled by user request
// To re-enable: Restore GoogleGenAI import and implementation

export const analyzeProjectHealth = async (state: AppState): Promise<string> => {
  return "Funcionalidad de IA desactivada temporalmente. Configure una API Key válida para habilitarla.";
};

export const chatWithData = async (query: string, state: AppState): Promise<string> => {
  return "El asistente de IA está desactivado en este momento.";
};