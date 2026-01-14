
import { createClient } from '@supabase/supabase-js';
import { DailyRoutine, Target, Template, User, TaskCategory } from '../types';

const GLOBAL_ROUTINE_KEY = 'chronos_planner_data_global';
const GLOBAL_TARGETS_KEY = 'chronos_targets_data_global';
const GLOBAL_TEMPLATES_KEY = 'chronos_templates_data_global';
const USERS_KEY = 'chronos_users_data_global';
const SESSION_KEY = 'chronos_active_session';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== "undefined") 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// Unicode-safe Base64 encoding/decoding
const toToken = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
const fromToken = (str: string) => {
  try {
    return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch (e) {
    return '';
  }
};

export const cloudService = {
  isAvailable: () => !!supabase,
  saveToCloud: async (userId: string, username: string, payload: any): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('chronos_sync').upsert({ user_id: userId, username, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      return !error;
    } catch (e) { return false; }
  }
};

export const storageService = {
  // Fix: Add requestPersistence to allow storage persistence requests from App.tsx
  requestPersistence: async () => {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  },

  saveSession: (user: User) => localStorage.setItem(SESSION_KEY, JSON.stringify(user)),
  getSession: (): User => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {}
    const defaultUser = { id: 'local-default-id', username: 'Local User' };
    storageService.saveSession(defaultUser);
    return defaultUser;
  },
  clearSession: () => localStorage.removeItem(SESSION_KEY),
  
  // Fix: Add loginUser method for AuthView login logic
  loginUser: async (username: string, password: string): Promise<User | null> => {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const user = users.find((u: any) => u.username === username && u.password === password);
      if (user) {
        const sessionUser = { id: user.id, username: user.username };
        storageService.saveSession(sessionUser);
        return sessionUser;
      }
    } catch (e) {}
    return null;
  },

  // Fix: Add registerUser method for AuthView registration logic
  registerUser: async (username: string, password: string): Promise<User | null> => {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.find((u: any) => u.username === username)) return null;
      const newUser = { id: crypto.randomUUID(), username, password };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      const sessionUser = { id: newUser.id, username: newUser.username };
      storageService.saveSession(sessionUser);
      return sessionUser;
    } catch (e) {}
    return null;
  },

  // Data Fetching
  getAllRoutines: (): Record<string, DailyRoutine> => {
    try {
      return JSON.parse(localStorage.getItem(GLOBAL_ROUTINE_KEY) || '{}');
    } catch (e) { return {}; }
  },
  getTargets: (): Target[] => {
    try {
      return JSON.parse(localStorage.getItem(GLOBAL_TARGETS_KEY) || '[]');
    } catch (e) { return []; }
  },
  getTemplates: (): Template[] => {
    try {
      return JSON.parse(localStorage.getItem(GLOBAL_TEMPLATES_KEY) || '[]');
    } catch (e) { return []; }
  },

  // Data Saving
  saveRoutine: async (routine: DailyRoutine) => {
    const data = storageService.getAllRoutines();
    data[routine.date] = routine;
    localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(data));
    localStorage.setItem('chronos_last_saved', new Date().toISOString());
  },
  saveTargets: async (targets: Target[]) => {
    localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(targets));
    localStorage.setItem('chronos_last_saved', new Date().toISOString());
  },

  // Fix: Add deleteTemplate for template management in TemplatesView
  deleteTemplate: (id: string) => {
    const templates = storageService.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(filtered));
  },

  getLastSavedTime: () => localStorage.getItem('chronos_last_saved'),

  // THE NEW SYNC KEY SYSTEM (Replaces File system)
  generateSyncKey: (): string => {
    const data = {
      routines: storageService.getAllRoutines(),
      targets: storageService.getTargets(),
      templates: storageService.getTemplates(),
      version: '2.0',
      timestamp: Date.now()
    };
    return toToken(JSON.stringify(data));
  },

  applySyncKey: (token: string): boolean => {
    try {
      const raw = fromToken(token);
      if (!raw) return false;
      const data = JSON.parse(raw);
      
      if (!data.routines && !data.targets) return false;

      // Sanitized Routine Import
      if (data.routines) {
        const sanitized: Record<string, DailyRoutine> = {};
        Object.entries(data.routines).forEach(([date, r]: [string, any]) => {
          sanitized[date] = {
            date: r.date || date,
            tasks: Array.isArray(r.tasks) ? r.tasks : [],
            notes: r.notes || '',
            mediaLinks: Array.isArray(r.mediaLinks) ? r.mediaLinks : []
          };
        });
        localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(sanitized));
      }

      // Sanitized Target Import
      if (data.targets) {
        localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(data.targets));
      }

      if (data.templates) {
        localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(data.templates));
      }

      localStorage.setItem('chronos_last_saved', new Date().toISOString());
      return true;
    } catch (e) {
      console.error("Sync Key error:", e);
      return false;
    }
  },

  // Fix: Add importAllData as an alias for applySyncKey to fix error in AuthView
  importAllData: (token: string): boolean => {
    return storageService.applySyncKey(token);
  }
};
