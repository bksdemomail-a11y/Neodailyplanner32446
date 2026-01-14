
import { createClient } from '@supabase/supabase-js';
import { DailyRoutine, Target, Template, User } from '../types';

const GLOBAL_ROUTINE_KEY = 'chronos_planner_data_global';
const GLOBAL_TARGETS_KEY = 'chronos_targets_data_global';
const GLOBAL_TEMPLATES_KEY = 'chronos_templates_data_global';
const USERS_KEY = 'chronos_users_data_global';
const SESSION_KEY = 'chronos_active_session';

// Environment variables from Vite/Vercel
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Initialize Supabase only if keys exist
const supabase = (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== "undefined") 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const cloudService = {
  isAvailable: () => !!supabase,

  saveToCloud: async (userId: string, username: string, payload: any): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('chronos_sync')
        .upsert({ 
          user_id: userId, 
          username: username,
          data: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      return !error;
    } catch (e) {
      console.warn("Cloud sync unavailable, continuing with local storage.");
      return false;
    }
  },

  loadFromCloud: async (username: string): Promise<any | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('chronos_sync')
        .select('data')
        .eq('username', username)
        .single();
      
      if (error || !data) return null;
      return data.data;
    } catch (e) {
      return null;
    }
  }
};

export const storageService = {
  // Session Persistence
  saveSession: (user: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  
  // Updated for direct access: returns a default local user if no session exists
  getSession: (): User => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session);
    
    // Default local user for direct access
    const defaultUser = { id: 'local-default-id', username: 'Local User' };
    storageService.saveSession(defaultUser);
    return defaultUser;
  },

  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Request the browser to keep data forever
  requestPersistence: async (): Promise<boolean> => {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Storage persistence: ${isPersisted ? 'Permanent' : 'Temporary'}`);
      return isPersisted;
    }
    return false;
  },

  getIsSynced: (): boolean => !!supabase,

  saveRoutine: async (routine: DailyRoutine, user?: User): Promise<void> => {
    const allData = storageService.getAllRoutines();
    allData[routine.date] = routine;
    localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(allData));
    
    if (user && supabase) {
      await cloudService.saveToCloud(user.id, user.username, storageService.getRawData(user.id));
    }
    // Update a "last saved" timestamp in local storage
    localStorage.setItem('chronos_last_saved', new Date().toISOString());
  },

  getLastSavedTime: (): string | null => {
    return localStorage.getItem('chronos_last_saved');
  },

  getRoutine: (date: string): DailyRoutine => {
    const allData = storageService.getAllRoutines();
    return allData[date] || { date, tasks: [] };
  },

  getAllRoutines: (): Record<string, DailyRoutine> => {
    const stored = localStorage.getItem(GLOBAL_ROUTINE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  saveTargets: async (targets: Target[], user?: User): Promise<void> => {
    localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(targets));
    if (user && supabase) {
      await cloudService.saveToCloud(user.id, user.username, storageService.getRawData(user.id));
    }
    localStorage.setItem('chronos_last_saved', new Date().toISOString());
  },

  getTargets: (): Target[] => {
    const stored = localStorage.getItem(GLOBAL_TARGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getTemplates: (): Template[] => {
    const stored = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  deleteTemplate: (id: string): void => {
    const templates = storageService.getTemplates();
    const updated = templates.filter(t => t.id !== id);
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(updated));
  },

  loginUser: async (username: string, password: string): Promise<User | null> => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('chronos_sync')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (data && !error) {
          if (data.data) {
            storageService.importAllData(btoa(JSON.stringify(data.data)));
          }
          return { id: data.user_id, username: data.username };
        }
      } catch (e) {
        console.warn("Supabase login failed, checking local users.");
      }
    }

    const stored = localStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      return { id: user.id, username: user.username };
    }
    return null;
  },

  registerUser: async (username: string, password: string): Promise<User | null> => {
    const userId = crypto.randomUUID();
    
    if (supabase) {
      try {
        const { error } = await supabase
          .from('chronos_sync')
          .insert({ user_id: userId, username, password, data: {} });
        
        if (error) {
          console.error("Supabase registration error:", error);
          if (error.code === '23505') return null;
        }
      } catch (e) {
        console.warn("Supabase registration failed, registering locally only.");
      }
    }

    const stored = localStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    if (users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) return null;
    
    users.push({ id: userId, username, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { id: userId, username };
  },

  getRawData: (userId?: string): any => {
    return {
      routines: storageService.getAllRoutines(),
      targets: storageService.getTargets(),
      templates: storageService.getTemplates(),
      exportedAt: new Date().toISOString(),
    };
  },

  exportAllData: (userId?: string): string => {
    return btoa(JSON.stringify(storageService.getRawData(userId)));
  },

  importAllData: (syncToken: string): boolean => {
    try {
      const raw = atob(syncToken);
      if (!raw) return false;
      const decoded = JSON.parse(raw);
      
      if (decoded.routines) localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(decoded.routines));
      if (decoded.targets) localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(decoded.targets));
      if (decoded.templates) localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(decoded.templates));
      
      return true;
    } catch (e) {
      return false;
    }
  }
};
