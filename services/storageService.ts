
import { DailyRoutine, Target, Template, User } from '../types';

const GLOBAL_ROUTINE_KEY = 'chronos_planner_data_global';
const GLOBAL_TARGETS_KEY = 'chronos_targets_data_global';
const GLOBAL_TEMPLATES_KEY = 'chronos_templates_data_global';

export const storageService = {
  // Routine Management
  saveRoutine: (routine: DailyRoutine) => {
    const allData = storageService.getAllRoutines();
    allData[routine.date] = routine;
    localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(allData));
  },

  getRoutine: (date: string): DailyRoutine => {
    const allData = storageService.getAllRoutines();
    return allData[date] || { date, tasks: [] };
  },

  getAllRoutines: (): Record<string, DailyRoutine> => {
    const stored = localStorage.getItem(GLOBAL_ROUTINE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  // Template Management
  saveTemplate: (template: Template) => {
    const templates = storageService.getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex > -1) templates[existingIndex] = template;
    else templates.push(template);
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(templates));
  },

  getTemplates: (): Template[] => {
    const stored = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  deleteTemplate: (id: string) => {
    const templates = storageService.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(templates));
  },

  // Target Management
  saveTargets: (targets: Target[]) => {
    localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(targets));
  },

  getTargets: (): Target[] => {
    const stored = localStorage.getItem(GLOBAL_TARGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // User Management (Mock implementation for AuthView support)
  loginUser: (username: string, _password: string): User | null => {
    // Basic mock logic for demonstration
    return { id: 'mock-user-1', username };
  },

  registerUser: (username: string, _password: string): User | null => {
    // Basic mock logic for demonstration
    return { id: 'mock-user-1', username };
  },

  // Global Sync Management
  exportAllData: (): string => {
    const data = {
      routines: storageService.getAllRoutines(),
      targets: storageService.getTargets(),
      templates: storageService.getTemplates(),
      exportedAt: new Date().toISOString(),
    };
    return btoa(JSON.stringify(data));
  },

  importAllData: (syncToken: string): boolean => {
    try {
      const decoded = JSON.parse(atob(syncToken));
      if (decoded.routines) {
        localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(decoded.routines));
      }
      if (decoded.targets) {
        localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(decoded.targets));
      }
      if (decoded.templates) {
        localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(decoded.templates));
      }
      return true;
    } catch (e) {
      console.error("Sync Token Invalid", e);
      return false;
    }
  }
};
