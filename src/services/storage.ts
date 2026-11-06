import { StudyKit, UserProfile, AdminSystemSettings, BackgroundTask, SystemErrorLog } from '../types';
import { DEFAULT_STUDY_KITS } from '../data/defaultKits';

const STORAGE_KEYS = {
  KITS: 'studykit_kits_v1',
  USER: 'studykit_current_user_v1',
  USERS_LIST: 'studykit_users_list_v1',
  SETTINGS: 'studykit_settings_v1',
  TASKS: 'studykit_tasks_v1',
  LOGS: 'studykit_logs_v1',
};

const DEFAULT_USER: UserProfile = {
  id: 'student-demo',
  email: 'student@university.edu',
  name: 'Алексей Смирнов',
  role: 'student',
  createdAt: '2026-11-01T08:00:00Z',
  quotas: {
    kitsCreated: 2,
    kitsLimit: 10,
    audioGenerations: 2,
    audioLimit: 5,
    chatQueriesToday: 4,
    chatLimit: 50,
  },
};

const DEFAULT_USERS_LIST: UserProfile[] = [
  DEFAULT_USER,
  {
    id: 'student-2',
    email: 'maria.k@university.edu',
    name: 'Мария Кузнецова',
    role: 'student',
    createdAt: '2026-11-02T09:30:00Z',
    quotas: {
      kitsCreated: 3,
      kitsLimit: 10,
      audioGenerations: 1,
      audioLimit: 5,
      chatQueriesToday: 12,
      chatLimit: 50,
    },
  },
  {
    id: 'admin-1',
    email: 'admin@studykit.edu',
    name: 'Администратор системы',
    role: 'admin',
    createdAt: '2026-10-15T00:00:00Z',
    quotas: {
      kitsCreated: 0,
      kitsLimit: 100,
      audioGenerations: 0,
      audioLimit: 100,
      chatQueriesToday: 0,
      chatLimit: 500,
    },
  },
];

const DEFAULT_SETTINGS: AdminSystemSettings = {
  maxKitsPerUser: 10,
  maxAudioGenerations: 5,
  maxChatQueriesPerDay: 50,
  maxRegenerationsPerDay: 20,
};

const DEFAULT_TASKS: BackgroundTask[] = [
  {
    id: 'task-1',
    kitId: 'kit-macroeconomics-1',
    kitTitle: 'Основы макроэкономики: инфляция и денежно-кредитная политика',
    taskType: 'full',
    status: 'completed',
    startedAt: '2026-11-04T10:15:00Z',
    completedAt: '2026-11-04T10:16:30Z',
  },
  {
    id: 'task-2',
    kitId: 'kit-cell-biology-2',
    kitTitle: 'Клеточная биология: митоз и мейоз',
    taskType: 'audio',
    status: 'completed',
    startedAt: '2026-11-03T16:01:00Z',
    completedAt: '2026-11-03T16:02:10Z',
  },
];

const DEFAULT_LOGS: SystemErrorLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-04T10:15:02Z',
    level: 'info',
    source: 'TextExtractor',
    message: 'Извлечен текст PDF (3 стр., 14 820 симв.)',
  },
  {
    id: 'log-2',
    timestamp: '2026-11-04T10:16:35Z',
    level: 'info',
    source: 'AudioSynthesizer',
    message: 'Озвучивание сценария подкаста успешно завершено (165 сек.)',
  },
];

export const StorageService = {
  getKits(): StudyKit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KITS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(DEFAULT_STUDY_KITS));
        return DEFAULT_STUDY_KITS;
      }
      const parsed: StudyKit[] = JSON.parse(data);
      // Ensure default medical kit is present
      const hasMed = parsed.some((k) => k.subject === 'Медицина' || k.id === 'kit-medicine-pharma-1');
      if (!hasMed) {
        const medKit = DEFAULT_STUDY_KITS.find((k) => k.id === 'kit-medicine-pharma-1');
        if (medKit) {
          parsed.unshift(medKit);
          localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch (e) {
      console.error('Failed to read kits from localStorage', e);
      return DEFAULT_STUDY_KITS;
    }
  },

  saveKits(kits: StudyKit[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.KITS, JSON.stringify(kits));
    } catch (e) {
      console.error('Failed to save kits to localStorage', e);
    }
  },

  getKitById(id: string): StudyKit | undefined {
    const kits = this.getKits();
    return kits.find((k) => k.id === id);
  },

  saveKit(kit: StudyKit): void {
    const kits = this.getKits();
    const index = kits.findIndex((k) => k.id === kit.id);
    if (index >= 0) {
      kits[index] = { ...kit, updatedAt: new Date().toISOString() };
    } else {
      kits.unshift(kit);
    }
    this.saveKits(kits);
  },

  deleteKit(id: string): void {
    const kits = this.getKits();
    const filtered = kits.filter((k) => k.id !== id);
    this.saveKits(filtered);
  },

  getCurrentUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_USER;
    }
  },

  saveCurrentUser(user: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUsersList(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(DEFAULT_USERS_LIST));
        return DEFAULT_USERS_LIST;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_USERS_LIST;
    }
  },

  saveUsersList(users: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  },

  getSettings(): AdminSystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AdminSystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getTasks(): BackgroundTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_TASKS;
    }
  },

  addTask(task: BackgroundTask): void {
    const tasks = this.getTasks();
    tasks.unshift(task);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks.slice(0, 50)));
  },

  updateTask(taskId: string, updates: Partial<BackgroundTask>): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  },

  getLogs(): SystemErrorLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
        return DEFAULT_LOGS;
      }
      return JSON.parse(data);
    } catch (e) {
      return DEFAULT_LOGS;
    }
  },

  addLog(log: Omit<SystemErrorLog, 'id' | 'timestamp'>): void {
    const logs = this.getLogs();
    const newLog: SystemErrorLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 100)));
  },
};
