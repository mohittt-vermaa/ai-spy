/**
 * IPC Handlers - Communication between main and renderer processes
 */

import { ipcMain, dialog } from 'electron';
import { AgentOrchestrator } from '../services/AgentOrchestrator.js';
import { ConfigManager } from '../services/ConfigManager.js';
import { ProjectManager } from '../services/ProjectManager.js';
import { TelemetryServer } from '../services/TelemetryServer.js';
import { AppConfig, AgentConfig, Project, Task, Agent, AgentActivity, AIProvider, ProviderConfig, AgentProviderConfig } from '../../shared/types.js';

export function setupIpcHandlers(
  orchestrator: AgentOrchestrator,
  configManager: ConfigManager,
  projectManager: ProjectManager,
  telemetryServer: TelemetryServer
): void {
  // Config handlers
  ipcMain.handle('config:get', () => configManager.getConfig());
  
  ipcMain.handle('config:update', async (_event, updates: Partial<AppConfig>) => {
    configManager.updateConfig(updates);
    await configManager.save();
    return configManager.getConfig();
  });

  ipcMain.handle('config:update-office', async (_event, updates: Partial<AppConfig['office']>) => {
    configManager.updateOfficeConfig(updates);
    await configManager.save();
    return configManager.getConfig();
  });

  ipcMain.handle('config:update-claude', async (_event, updates: Partial<AppConfig['claude']>) => {
    configManager.updateClaudeConfig(updates);
    await configManager.save();
    return configManager.getConfig();
  });

  ipcMain.handle('config:update-ui', async (_event, updates: Partial<AppConfig['ui']>) => {
    configManager.updateUIConfig(updates);
    await configManager.save();
    return configManager.getConfig();
  });

  // Provider config handlers
  ipcMain.handle('providers:get-all', () => configManager.getProviders());

  ipcMain.handle('providers:get', (_event, provider: AIProvider) => configManager.getProvider(provider));

  ipcMain.handle('providers:update', async (_event, provider: AIProvider, updates: Partial<ProviderConfig>) => {
    configManager.updateProvider(provider, updates);
    await configManager.save();
    return configManager.getProvider(provider);
  });

  ipcMain.handle('agents:update-provider', async (_event, agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig) => {
    configManager.updateAgentProvider(agentId, provider, providerConfig);
    await configManager.save();
    return orchestrator.getAgent(agentId);
  });

  // Agent config handlers
  ipcMain.handle('agents:get-all', () => orchestrator.getAllAgents());

  ipcMain.handle('agents:get', (_event, agentId: string) => orchestrator.getAgent(agentId));

  ipcMain.handle('agents:add', async (_event, agent: AgentConfig) => {
    configManager.addAgent(agent);
    orchestrator.addAgentConfig(agent);
    await configManager.save();
    return orchestrator.getAllAgents();
  });

  ipcMain.handle('agents:remove', async (_event, agentId: string) => {
    configManager.removeAgent(agentId);
    await orchestrator.removeAgentConfig(agentId);
    await configManager.save();
    return orchestrator.getAllAgents();
  });

  ipcMain.handle('agents:update', async (_event, agentId: string, updates: Partial<AgentConfig>) => {
    configManager.updateAgent(agentId, updates);
    const updated = configManager.getConfig().agents.find((a) => a.id === agentId);
    if (updated) {
      orchestrator.addAgentConfig(updated);
    }
    await configManager.save();
    return orchestrator.getAgent(agentId);
  });

  // Agent control handlers
  ipcMain.handle('agents:start', async (_event, agentId: string, task?: string) => {
    return orchestrator.startAgent(agentId, task);
  });

  ipcMain.handle('agents:stop', async (_event, agentId: string) => {
    await orchestrator.stopAgent(agentId);
    return true;
  });

  ipcMain.handle('agents:start-all', async () => {
    await orchestrator.startAllAgents();
    return true;
  });

  ipcMain.handle('agents:stop-all', async () => {
    await orchestrator.stopAllAgents();
    return true;
  });

  // Project handlers
  ipcMain.handle('projects:get-all', async () => projectManager.getAllProjects());

  ipcMain.handle('projects:get-current', () => projectManager.getCurrentProject());

  ipcMain.handle('projects:create', async (_event, name: string, path: string, description?: string) => {
    return projectManager.createProject(name, path, description);
  });

  ipcMain.handle('projects:load', async (_event, projectId: string) => {
    return projectManager.loadProject(projectId);
  });

  ipcMain.handle('projects:delete', async (_event, projectId: string) => {
    await projectManager.deleteProject(projectId);
    return true;
  });

  ipcMain.handle('projects:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Project Folder',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Task handlers
  ipcMain.handle('tasks:add', async (_event, projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    return projectManager.addTask(projectId, task);
  });

  ipcMain.handle('tasks:update', async (_event, projectId: string, taskId: string, updates: Partial<Task>) => {
    return projectManager.updateTask(projectId, taskId, updates);
  });

  ipcMain.handle('tasks:delete', async (_event, projectId: string, taskId: string) => {
    return projectManager.deleteTask(projectId, taskId);
  });

  ipcMain.handle('tasks:move', async (_event, projectId: string, taskId: string, status: Task['status']) => {
    return projectManager.moveTask(projectId, taskId, status);
  });

  ipcMain.handle('tasks:assign', async (_event, projectId: string, taskId: string, agentId: string | null) => {
    return projectManager.assignTask(projectId, taskId, agentId);
  });

  // Office map handlers
  ipcMain.handle('office:load-map', async (_event, mapData: any) => {
    orchestrator.setOfficeMap(mapData);
    return true;
  });

  ipcMain.handle('office:get-map', () => orchestrator.getOfficeMap());

  // Telemetry handlers
  ipcMain.handle('telemetry:get-port', () => telemetryServer.getPort());
  
  ipcMain.handle('telemetry:get-clients', () => telemetryServer.getConnectedClients());

  // File system handlers
  ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
    const fs = await import('fs/promises');
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  });

  ipcMain.handle('fs:list-dir', async (_event, dirPath: string) => {
    const fs = await import('fs/promises');
    return fs.readdir(dirPath, { withFileTypes: true });
  });

  // System handlers
  ipcMain.handle('system:open-external', async (_event, url: string) => {
    const { shell } = await import('electron');
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('system:show-item-in-folder', async (_event, filePath: string) => {
    const { shell } = await import('electron');
    await shell.showItemInFolder(filePath);
    return true;
  });

  // Window handlers
  ipcMain.handle('window:minimize', () => {
    // Handled by renderer
  });

  ipcMain.handle('window:maximize', () => {
    // Handled by renderer
  });

  ipcMain.handle('window:close', () => {
    // Handled by renderer
  });

  console.log('IPC handlers registered');
}