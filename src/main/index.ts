/**
 * Agent Mission Control - Electron Main Process
 * Handles window management, Claude Code integration, and agent orchestration
 */

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { AgentOrchestrator } from './services/AgentOrchestrator.js';
import { TelemetryServer } from './services/TelemetryServer.js';
import { ConfigManager } from './services/ConfigManager.js';
import { ProjectManager } from './services/ProjectManager.js';
import { setupIpcHandlers } from './ipc/handlers.js';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

class MissionControlApp {
  private mainWindow: BrowserWindow | null = null;
  private orchestrator: AgentOrchestrator;
  private telemetryServer: TelemetryServer;
  private configManager: ConfigManager;
  private projectManager: ProjectManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.projectManager = new ProjectManager(this.configManager);
    this.orchestrator = new AgentOrchestrator(this.configManager, this.projectManager);
    this.telemetryServer = new TelemetryServer(this.orchestrator);
  }

  async initialize(): Promise<void> {
    // Load configuration
    await this.configManager.load();
    
    // Setup IPC handlers
    setupIpcHandlers(
      this.orchestrator,
      this.configManager,
      this.projectManager,
      this.telemetryServer
    );

    // Start telemetry server
    await this.telemetryServer.start(this.configManager.getConfig().claude.telemetryPort);

    // Create main window
    await this.createWindow();

    // Auto-start agents if configured
    if (this.configManager.getConfig().claude.autoStart) {
      await this.orchestrator.startAllAgents();
    }
  }

  async createWindow(): Promise<void> {
    const preloadPath = join(__dirname, '../preload/index.js');
    
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      title: 'Agent Mission Control',
      icon: join(__dirname, '../../assets/icon.png'),
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    // Load renderer
    if (isDev) {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
      await this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  async shutdown(): Promise<void> {
    await this.orchestrator.stopAllAgents();
    await this.telemetryServer.stop();
    await this.configManager.save();
    
    if (this.mainWindow) {
      this.mainWindow.destroy();
    }
  }
}

// App lifecycle
const missionControl = new MissionControlApp();

app.whenReady().then(async () => {
  await missionControl.initialize();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await missionControl.createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await missionControl.shutdown();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await missionControl.shutdown();
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

export { MissionControlApp };