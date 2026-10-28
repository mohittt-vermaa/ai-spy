/**
 * Hook for accessing Electron API from renderer
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIProvider, ProviderConfig, ProviderConfigMap, AgentProviderConfig } from '../../shared/types';

interface ElectronAPI {
  config: {
    get: () => Promise<any>;
    update: (updates: any) => Promise<any>;
    updateOffice: (updates: any) => Promise<any>;
    updateClaude: (updates: any) => Promise<any>;
    updateUI: (updates: any) => Promise<any>;
  };
  providers: {
    getAll: () => Promise<ProviderConfigMap>;
    get: (provider: AIProvider) => Promise<ProviderConfig>;
    update: (provider: AIProvider, updates: Partial<ProviderConfig>) => Promise<ProviderConfig>;
  };
  agents: {
    getAll: () => Promise<any[]>;
    get: (agentId: string) => Promise<any>;
    add: (agent: any) => Promise<any[]>;
    remove: (agentId: string) => Promise<any[]>;
    update: (agentId: string, updates: any) => Promise<any>;
    start: (agentId: string, task?: string) => Promise<boolean>;
    stop: (agentId: string) => Promise<boolean>;
    startAll: () => Promise<boolean>;
    stopAll: () => Promise<boolean>;
    updateProvider: (agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig) => Promise<any>;
    onUpdate: (callback: (agent: any) => void) => () => void;
    onActivity: (callback: (activity: any) => void) => () => void;
  };
  projects: {
    getAll: () => Promise<any[]>;
    getCurrent: () => Promise<any>;
    create: (name: string, path: string, description?: string) => Promise<any>;
    load: (projectId: string) => Promise<any>;
    delete: (projectId: string) => Promise<boolean>;
    selectFolder: () => Promise<string | null>;
  };
  tasks: {
    add: (projectId: string, task: any) => Promise<any>;
    update: (projectId: string, taskId: string, updates: any) => Promise<any>;
    delete: (projectId: string, taskId: string) => Promise<boolean>;
    move: (projectId: string, taskId: string, status: any) => Promise<any>;
    assign: (projectId: string, taskId: string, agentId: string | null) => Promise<any>;
  };
  office: {
    loadMap: (mapData: any) => Promise<boolean>;
    getMap: () => Promise<any>;
  };
  telemetry: {
    getPort: () => Promise<number>;
    getClients: () => Promise<number>;
    onTelemetry: (callback: (event: any) => void) => () => void;
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

export function useElectronAPI(): ElectronAPI {
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      setApi(window.electronAPI);
    } else {
      // Wait for preload to be ready
      const checkApi = setInterval(() => {
        if (window.electronAPI) {
          setApi(window.electronAPI);
          clearInterval(checkApi);
        }
      }, 50);
      return () => clearInterval(checkApi);
    }
  }, []);

  // Return a mock API if not ready (for development)
  if (!api) {
    return createMockAPI();
  }

  return api;
}

function createMockAPI(): ElectronAPI {
  const mockAgents = [
    { id: 'pm-1', name: 'Nova', role: 'project-manager', state: 'idle', position: { x: 100, y: 150 }, color: '#ff6b6b', currentTask: null, taskProgress: 0, avatar: { front: '', back: '', left: '', right: '', portrait: '' } },
    { id: 'se-1', name: 'Codex', role: 'software-engineer', state: 'working', position: { x: 300, y: 150 }, color: '#4ecdc4', currentTask: 'Implementing auth module', taskProgress: 45, avatar: { front: '', back: '', left: '', right: '', portrait: '' } },
    { id: 'ux-1', name: 'Pixel', role: 'ui-ux-designer', state: 'thinking', position: { x: 500, y: 150 }, color: '#ffe66d', currentTask: 'Designing dashboard', taskProgress: 20, avatar: { front: '', back: '', left: '', right: '', portrait: '' } },
    { id: 'qa-1', name: 'Check', role: 'qa-tester', state: 'idle', position: { x: 700, y: 150 }, color: '#95e1d3', currentTask: null, taskProgress: 0, avatar: { front: '', back: '', left: '', right: '', portrait: '' } },
    { id: 'po-1', name: 'Vision', role: 'product-owner', state: 'meeting', position: { x: 900, y: 150 }, color: '#dda0dd', currentTask: 'Sprint planning', taskProgress: 0, avatar: { front: '', back: '', left: '', right: '', portrait: '' } },
  ];

  const mockProviders: ProviderConfigMap = {
      claude: { name: 'Claude Code', description: 'Local Claude Code CLI', executable: 'claude', defaultModel: 'claude-sonnet-4-5', supportsApiKey: false, configFields: ['executable', 'workspacePath'] },
      anthropic: { name: 'Anthropic API', description: 'Direct Anthropic API access', defaultModel: 'claude-sonnet-4-5', supportsApiKey: true, apiKeyEnvVar: 'ANTHROPIC_API_KEY', configFields: ['apiKey', 'model', 'baseUrl'] },
      openai: { name: 'OpenAI', description: 'OpenAI API access', defaultModel: 'gpt-4o', supportsApiKey: true, apiKeyEnvVar: 'OPENAI_API_KEY', configFields: ['apiKey', 'model', 'baseUrl'] },
      gemini: { name: 'Gemini', description: 'Google Gemini API access', defaultModel: 'gemini-1.5-pro', supportsApiKey: true, apiKeyEnvVar: 'GEMINI_API_KEY', configFields: ['apiKey', 'model', 'baseUrl'] },
      custom: { name: 'Custom (OpenAI-compatible)', description: 'Any OpenAI-compatible endpoint', defaultModel: '', supportsApiKey: true, apiKeyEnvVar: 'CUSTOM_API_KEY', configFields: ['apiKey', 'model', 'baseUrl'] },
    };

  return {
    config: {
      get: () => Promise.resolve({ office: { mapId: 'default', theme: 'cyberpunk', highlightColor: '#00ff88' }, agents: [], providers: mockProviders, claude: { executable: 'claude', workspacePath: '', autoStart: false, telemetryPort: 8765 }, ui: { pixelScale: 2, showGrid: false, animationSpeed: 1.0, theme: 'dark' } }),
      update: (u) => Promise.resolve(u),
      updateOffice: (u) => Promise.resolve(u),
      updateClaude: (u) => Promise.resolve(u),
      updateUI: (u) => Promise.resolve(u),
    },
    providers: {
      getAll: () => Promise.resolve(mockProviders),
      get: (p) => Promise.resolve(mockProviders[p] as ProviderConfig),
      update: (p, u) => Promise.resolve({ ...(mockProviders[p] as ProviderConfig), ...u }),
    },
    agents: {
      getAll: () => Promise.resolve(mockAgents),
      get: (id) => Promise.resolve(mockAgents.find(a => a.id === id)),
      add: (a) => Promise.resolve([...mockAgents, a]),
      remove: (id) => Promise.resolve(mockAgents.filter(a => a.id !== id)),
      update: (id, u) => Promise.resolve(mockAgents.find(a => a.id === id)),
      start: () => Promise.resolve(true),
      stop: () => Promise.resolve(true),
      startAll: () => Promise.resolve(true),
      stopAll: () => Promise.resolve(true),
      updateProvider: (id, p, pc) => Promise.resolve(mockAgents.find(a => a.id === id)),
      onUpdate: (cb) => { cb(mockAgents[1]); return () => {}; },
      onActivity: (cb) => { return () => {}; },
    },
    projects: {
      getAll: () => Promise.resolve([{ id: 'proj-1', name: 'Mission Control', path: '/tmp/mission-control', description: 'AI Agent Office', agents: [], tasks: [], createdAt: Date.now(), updatedAt: Date.now() }]),
      getCurrent: () => Promise.resolve({ id: 'proj-1', name: 'Mission Control', path: '/tmp/mission-control', description: 'AI Agent Office', agents: [], tasks: [], createdAt: Date.now(), updatedAt: Date.now() }),
      create: (n, p, d) => Promise.resolve({ id: 'new', name: n, path: p, description: d, agents: [], tasks: [], createdAt: Date.now(), updatedAt: Date.now() }),
      load: () => Promise.resolve(null),
      delete: () => Promise.resolve(true),
      selectFolder: () => Promise.resolve('/tmp/test'),
    },
    tasks: {
      add: (pid, t) => Promise.resolve({ ...t, id: 'task-new', createdAt: Date.now(), updatedAt: Date.now() }),
      update: (pid, tid, u) => Promise.resolve({ id: tid, ...u }),
      delete: () => Promise.resolve(true),
      move: (pid, tid, s) => Promise.resolve({ id: tid, status: s }),
      assign: (pid, tid, aid) => Promise.resolve({ id: tid, assignee: aid }),
    },
    office: {
      loadMap: () => Promise.resolve(true),
      getMap: () => Promise.resolve(null),
    },
    telemetry: {
      getPort: () => Promise.resolve(8765),
      getClients: () => Promise.resolve(0),
      onTelemetry: (cb) => () => {},
    },
    fs: {
      readFile: () => Promise.resolve(''),
      writeFile: () => Promise.resolve(true),
      listDir: () => Promise.resolve([]),
    },
    system: {
      openExternal: () => Promise.resolve(true),
      showItemInFolder: () => Promise.resolve(true),
    },
    window: {
      minimize: () => {},
      maximize: () => {},
      close: () => {},
      onClose: (cb) => () => {},
    },
  };
}