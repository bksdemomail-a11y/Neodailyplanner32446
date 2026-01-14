
import { DailyRoutine, Target, Template, User } from '../types';

const GLOBAL_ROUTINE_KEY = 'chronos_planner_data_global';
const GLOBAL_TARGETS_KEY = 'chronos_targets_data_global';
const GLOBAL_TEMPLATES_KEY = 'chronos_templates_data_global';
const USERS_KEY = 'chronos_users_data_global';

// Persistent file handle for "Live Sync" (Local Workspace)
let fileHandle: any | null = null;

/**
 * Cloud storage bridge. 
 * In a production Firebase environment, these functions would 
 * call `setDoc` or `addDoc` in Firestore.
 */
export const cloudService = {
  saveToCloud: async (userId: string, data: any) => {
    console.log(`[Cloud] Syncing data for user: ${userId}...`);
    // Simulated Firebase Logic:
    // await db.collection('users').doc(userId).set(data);
    return true;
  },
  loadFromCloud: async (userId: string) => {
    console.log(`[Cloud] Fetching data for user: ${userId}...`);
    // Simulated Firebase Logic:
    // const snapshot = await db.collection('users').doc(userId).get();
    // return snapshot.data();
    return null;
  }
};

export const storageService = {
  requestPersistence: async () => {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  },

  setWorkspaceHandle: async (handle: any) => {
    fileHandle = handle;
    try {
      const file = await handle.getFile();
      const content = await file.text();
      if (content && content.trim().startsWith('{')) {
        storageService.importAllData(btoa(content));
      }
      return true;
    } catch (e) {
      return true; 
    }
  },

  getIsSynced: () => !!fileHandle,

  // Routine Management
  saveRoutine: async (routine: DailyRoutine, userId?: string) => {
    const allData = storageService.getAllRoutines();
    allData[routine.date] = routine;
    localStorage.setItem(GLOBAL_ROUTINE_KEY, JSON.stringify(allData));
    
    // Automatic Cloud Sync if logged in
    if (userId) {
      await cloudService.saveToCloud(userId, storageService.getRawData());
    }
  },

  getRoutine: (date: string): DailyRoutine => {
    const allData = storageService.getAllRoutines();
    return allData[date] || { date, tasks: [] };
  },

  getAllRoutines: (): Record<string, DailyRoutine> => {
    const stored = localStorage.getItem(GLOBAL_ROUTINE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  // Target Management
  saveTargets: async (targets: Target[], userId?: string) => {
    localStorage.setItem(GLOBAL_TARGETS_KEY, JSON.stringify(targets));
    if (userId) {
      await cloudService.saveToCloud(userId, storageService.getRawData());
    }
  },

  getTargets: (): Target[] => {
    const stored = localStorage.getItem(GLOBAL_TARGETS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Template Management
  // Fix: Added getTemplates to storageService as requested by TemplatesView
  getTemplates: (): Template[] => {
    const stored = localStorage.getItem(GLOBAL_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Fix: Added saveTemplate to handle library additions
  saveTemplate: (template: Template) => {
    const templates = storageService.getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(templates));
  },

  // Fix: Added deleteTemplate as requested by TemplatesView
  deleteTemplate: (id: string) => {
    const templates = storageService.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(GLOBAL_TEMPLATES_KEY, JSON.stringify(templates));
  },

  // Authentication Management (Local Simulator for Cloud)
  loginUser: async (username: string, password: string): Promise<User | null> => {
    const stored = localStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...safeUser } = user;
      // When logging in, pull their cloud data to local storage
      const cloudData = await cloudService.loadFromCloud(user.id);
      if (cloudData) {
        storageService.importAllData(btoa(JSON.stringify(cloudData)));
      }
      return safeUser as User;
    }
    return null;
  },

  registerUser: (username: string, password: string): User | null => {
    const stored = localStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];
    if (users.some((u: any) => u.username === username)) return null;
    const newUser = { id: crypto.randomUUID(), username, password };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const { password: _, ...safeUser } = newUser;
    return safeUser as User;
  },

  // Global Sync Management
  getRawData: () => ({
    routines: storageService.getAllRoutines(),
    targets: storageService.getTargets(),
    templates: storageService.getTemplates(),
    exportedAt: new Date().toISOString(),
  }),

  exportAllData: (): string => {
    return btoa(JSON.stringify(storageService.getRawData()));
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
