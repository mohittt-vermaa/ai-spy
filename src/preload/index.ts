/**
 * Preload Script - Secure bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig, Agent, AgentConfig, Project, Task, AgentActivity, TelemetryEvent, AgentState, Position, AIProvider, ProviderConfig, ProviderConfigMap, AgentProviderConfig } from '../shared/types.js';

// Type definitions for the API
interface ElectronAPI {
  config: {
    get: () => Promise<AppConfig>;
    update: (updates: Partial<AppConfig>) => Promise<AppConfig>;
    updateOffice: (updates: Partial<AppConfig['office']>) => Promise<AppConfig>;
    updateClaude: (updates: Partial<AppConfig['claude']>) => Promise<AppConfig>;
    updateUI: (updates: Partial<AppConfig['ui']>) => Promise<AppConfig>;
  };
  providers: {
    getAll: () => Promise<ProviderConfigMap>;
    get: (provider: AIProvider) => Promise<ProviderConfig>;
    update: (provider: AIProvider, updates: Partial<ProviderConfig>) => Promise<ProviderConfig>;
  };
  agents: {
    getAll: () => Promise<Agent[]>;
    get: (agentId: string) => Promise<Agent | undefined>;
    add: (agent: AgentConfig) => Promise<Agent[]>;
    remove: (agentId: string) => Promise<Agent[]>;
    update: (agentId: string, updates: Partial<AgentConfig>) => Promise<Agent | undefined>;
    start: (agentId: string, task?: string) => Promise<boolean>;
    stop: (agentId: string) => Promise<boolean>;
    startAll: () => Promise<boolean>;
    stopAll: () => Promise<boolean>;
    updateProvider: (agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig) => Promise<Agent | undefined>;
    onUpdate: (callback: (agent: Agent) => void) => () => void;
    onActivity: (callback: (activity: AgentActivity) => void) => () => void;
  };
  projects: {
    getAll: () => Promise<Project[]>;
    getCurrent: () => Promise<Project | null>;
    create: (name: string, path: string, description?: string) => Promise<Project>;
    load: (projectId: string) => Promise<Project | null>;
    delete: (projectId: string) => Promise<boolean>;
    selectFolder: () => Promise<string | null>;
  };
  tasks: {
    add: (projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    update: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<Task | null>;
    delete: (projectId: string, taskId: string) => Promise<boolean>;
    move: (projectId: string, taskId: string, status: Task['status']) => Promise<Task | null>;
    assign: (projectId: string, taskId: string, agentId: string | null) => Promise<Task | null>;
  };
  office: {
    loadMap: (mapData: any) => Promise<boolean>;
    getMap: () => Promise<any>;
  };
  telemetry: {
    getPort: () => Promise<number>;
    getClients: () => Promise<number>;
    onTelemetry: (callback: (event: TelemetryEvent) => void) => () => void;
  };
  fs: {
    readFile: (filePath: string) => Promise<string>;
    writeFile: (filePath: string, content: string) => Promise<boolean>;
    listDir: (dirPath: string) => Promise<any[]>;
  };
  system: {
    openExternal: (url: string) => Promise<boolean>;
    showItemInFolder: (filePath: string) => Promise<boolean>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    onClose: (callback: () => void) => () => void;
  };
}

const electronAPI: ElectronAPI = {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates) => ipcRenderer.invoke('config:update', updates),
    updateOffice: (updates) => ipcRenderer.invoke('config:update-office', updates),
    updateClaude: (updates) => ipcRenderer.invoke('config:update-claude', updates),
    updateUI: (updates) => ipcRenderer.invoke('config:update-ui', updates),
  },
  providers: {
    getAll: () => ipcRenderer.invoke('providers:get-all'),
    get: (provider) => ipcRenderer.invoke('providers:get', provider),
    update: (provider, updates) => ipcRenderer.invoke('providers:update', provider, updates),
  },
  agents: {
    getAll: () => ipcRenderer.invoke('agents:get-all'),
    get: (agentId) => ipcRenderer.invoke('agents:get', agentId),
    add: (agent) => ipcRenderer.invoke('agents:add', agent),
    remove: (agentId) => ipcRenderer.invoke('agents:remove', agentId),
    update: (agentId, updates) => ipcRenderer.invoke('agents:update', agentId, updates),
    start: (agentId, task) => ipcRenderer.invoke('agents:start', agentId, task),
    stop: (agentId) => ipcRenderer.invoke('agents:stop', agentId),
    startAll: () => ipcRenderer.invoke('agents:start-all'),
    stopAll: () => ipcRenderer.invoke('agents:stop-all'),
    updateProvider: (agentId, provider, providerConfig) => ipcRenderer.invoke('agents:update-provider', agentId, provider, providerConfig),
    onUpdate: (callback) => {
      const handler = (_event: any, agent: Agent) => callback(agent);
      ipcRenderer.on('agent-update', handler);
      return () => ipcRenderer.off('agent-update', handler);
    },
    onActivity: (callback) => {
      const handler = (_event: any, activity: AgentActivity) => callback(activity);
      ipcRenderer.on('activity', handler);
      return () => ipcRenderer.off('activity', handler);
    },
  },
  projects: {
    getAll: () => ipcRenderer.invoke('projects:get-all'),
    getCurrent: () => ipcRenderer.invoke('projects:get-current'),
    create: (name, path, description) => ipcRenderer.invoke('projects:create', name, path, description),
    load: (projectId) => ipcRenderer.invoke('projects:load', projectId),
    delete: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
    selectFolder: () => ipcRenderer.invoke('projects:select-folder'),
  },
  tasks: {
    add: (projectId, task) => ipcRenderer.invoke('tasks:add', projectId, task),
    update: (projectId, taskId, updates) => ipcRenderer.invoke('tasks:update', projectId, taskId, updates),
    delete: (projectId, taskId) => ipcRenderer.invoke('tasks:delete', projectId, taskId),
    move: (projectId, taskId, status) => ipcRenderer.invoke('tasks:move', projectId, taskId, status),
    assign: (projectId, taskId, agentId) => ipcRenderer.invoke('tasks:assign', projectId, taskId, agentId),
  },
  office: {
    loadMap: (mapData) => ipcRenderer.invoke('office:load-map', mapData),
    getMap: () => ipcRenderer.invoke('office:get-map'),
  },
  telemetry: {
    getPort: () => ipcRenderer.invoke('telemetry:get-port'),
    getClients: () => ipcRenderer.invoke('telemetry:get-clients'),
    onTelemetry: (callback) => {
      const handler = (_event: any, event: TelemetryEvent) => callback(event);
      ipcRenderer.on('telemetry', handler);
      return () => ipcRenderer.off('telemetry', handler);
    },
  },
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
    listDir: (dirPath) => ipcRenderer.invoke('fs:list-dir', dirPath),
  },
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:open-external', url),
    showItemInFolder: (filePath) => ipcRenderer.invoke('system:show-item-in-folder', filePath),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    onClose: (callback) => {
      const handler = () => callback();
      ipcRenderer.on('window:close-request', handler);
      return () => ipcRenderer.off('window:close-request', handler);
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}