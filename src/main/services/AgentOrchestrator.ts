/**
 * AgentOrchestrator - Manages AI agents, spawns Claude Code processes, and tracks agent state
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ConfigManager } from './ConfigManager.js';
import { ProjectManager } from './ProjectManager.js';
import {
  Agent,
  AgentState,
  AgentRole,
  Position,
  AgentActivity,
  ActivityType,
  AgentConfig,
  TelemetryEvent,
  AIProvider,
  AgentProviderConfig,
  ProviderConfig,
} from '../../shared/types.js';

interface AgentProcess {
  agent: Agent;
  process: ChildProcess | null;
  lastHeartbeat: number;
}

export class AgentOrchestrator extends EventEmitter {
  private configManager: ConfigManager;
  private projectManager: ProjectManager;
  private agents: Map<string, AgentProcess> = new Map();
  private officeMap: any = null;
  private telemetryCallbacks: Set<(event: TelemetryEvent) => void> = new Set();

  // Office layout constants
  private readonly DESK_POSITIONS: Record<string, Position> = {
    'project-manager': { x: 100, y: 150 },
    'software-engineer': { x: 300, y: 150 },
    'ui-ux-designer': { x: 500, y: 150 },
    'qa-tester': { x: 700, y: 150 },
    'product-owner': { x: 900, y: 150 },
  };

  private readonly LOUNGE_POSITION: Position = { x: 500, y: 400 };
  private readonly MEETING_POSITION: Position = { x: 500, y: 250 };

  constructor(configManager: ConfigManager, projectManager: ProjectManager) {
    super();
    this.configManager = configManager;
    this.projectManager = projectManager;
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const config = this.configManager.getConfig();

    for (const agentConfig of config.agents) {
      this.addAgentConfig(agentConfig);
    }
  }

  private buildAgent(agentConfig: AgentConfig): Agent {
    return {
      id: agentConfig.id,
      name: agentConfig.name,
      role: agentConfig.role,
      provider: agentConfig.provider || 'claude',
      providerConfig: agentConfig.providerConfig || { model: '' },
      description: agentConfig.description,
      personality: agentConfig.personality,
      avatar: agentConfig.avatarPaths,
      position: this.DESK_POSITIONS[agentConfig.role] || { x: 100, y: 100 },
      targetPosition: null,
      state: 'idle',
      currentTask: null,
      taskProgress: 0,
      lastActivity: Date.now(),
      color: this.getRoleColor(agentConfig.role),
    };
  }

  /** Register a newly created agent so it shows up without restarting the app */
  addAgentConfig(agentConfig: AgentConfig): Agent {
    const existing = this.agents.get(agentConfig.id);
    if (existing) {
      existing.agent = { ...existing.agent, ...this.buildAgent(agentConfig) };
      this.emit('agent-update', existing.agent);
      return existing.agent;
    }

    const agent = this.buildAgent(agentConfig);
    this.agents.set(agent.id, {
      agent,
      process: null,
      lastHeartbeat: Date.now(),
    });
    this.emit('agent-update', agent);
    return agent;
  }

  /** Stop and forget an agent */
  async removeAgentConfig(agentId: string): Promise<void> {
    await this.stopAgent(agentId);
    this.agents.delete(agentId);
  }

  private getRoleColor(role: AgentRole): string {
    const colors: Record<AgentRole, string> = {
      'project-manager': '#ff6b6b',
      'software-engineer': '#4ecdc4',
      'ui-ux-designer': '#ffe66d',
      'qa-tester': '#95e1d3',
      'product-owner': '#dda0dd',
      'devops-engineer': '#f8b500',
      'data-scientist': '#6c5ce7',
      'security-engineer': '#e17055',
      'tech-writer': '#00cec9',
      'custom': '#a29bfe',
    };
    return colors[role] || '#ffffff';
  }

  async startAllAgents(): Promise<void> {
    for (const [id, agentProcess] of this.agents) {
      await this.startAgent(id);
    }
  }

  async startAgent(agentId: string, task?: string): Promise<boolean> {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess || agentProcess.process) {
      return false;
    }

    const config = this.configManager.getConfig();
    const project = this.projectManager.getCurrentProject();
    
    if (!project) {
      console.error('No project loaded');
      return false;
    }

    // Update agent state to walking to desk
    this.updateAgentState(agentId, 'walking');
    this.setAgentTargetPosition(agentId, this.DESK_POSITIONS[agentProcess.agent.role] || { x: 100, y: 100 });

    // Simulate walking animation delay
    await this.delay(1000);

    // Spawn agent process based on provider
    try {
      const agentConfig = config.agents.find(a => a.id === agentId);
      if (!agentConfig) {
        throw new Error(`Agent config not found for ${agentId}`);
      }

      const provider = agentConfig.provider || 'claude';
      const providerConfig = agentConfig.providerConfig || {};

      const agentProc = await this.spawnAgentProcess(agentProcess.agent, project.path, task, provider, providerConfig);
      agentProcess.process = agentProc;
      agentProcess.lastHeartbeat = Date.now();

      // Update state to working
      this.updateAgentState(agentId, 'working');
      this.addActivity(agentId, {
        type: 'started-task',
        message: task ? `Started: ${task}` : 'Agent started',
      });

      // Set up process handlers
      this.setupProcessHandlers(agentId, agentProc);

      return true;
    } catch (error) {
      console.error(`Failed to start agent ${agentId}:`, error);
      this.updateAgentState(agentId, 'error');
      return false;
    }
  }

  private async spawnAgentProcess(
    agent: Agent,
    projectPath: string,
    task: string | undefined,
    provider: AIProvider,
    providerConfig: AgentProviderConfig
  ): Promise<ChildProcess> {
    const config = this.configManager.getConfig();
    const providerSettings: ProviderConfig | undefined =
      config.providers?.[provider] ?? config.providers?.claude;

    // Prepare environment variables
    const env: Record<string, string> = {
      ...process.env,
      AGENT_ID: agent.id,
      AGENT_ROLE: agent.role,
      AGENT_NAME: agent.name,
      AGENT_PROVIDER: provider,
      AGENT_MODEL: providerConfig.model || providerSettings?.defaultModel || '',
      MISSION_CONTROL_PORT: config.claude.telemetryPort.toString(),
    };

    // Add API key if provided
    if (providerConfig.apiKey) {
      const apiKeyEnvVar = providerSettings?.apiKeyEnvVar || `${provider.toUpperCase()}_API_KEY`;
      env[apiKeyEnvVar] = providerConfig.apiKey;
    }

    // Add custom base URL if provided
    if (providerConfig.baseUrl) {
      env[`${provider.toUpperCase()}_BASE_URL`] = providerConfig.baseUrl;
    }

    // Build arguments for the agent script
    const args = [
      '--workspace',
      projectPath,
      '--agent',
      agent.id,
      '--role',
      agent.role,
      '--provider',
      provider,
    ];

    if (task) {
      args.push('--task', task);
    }

    if (providerConfig.model) {
      args.push('--model', providerConfig.model);
    }

    // In development, we might not have the actual CLI available, so use a mock
    const isDev = process.env.NODE_ENV === 'development';
    const executable = isDev ? 'node' : this.getProviderExecutable(provider, providerSettings);
    const scriptArgs = isDev
      ? [join(__dirname, '../../../mock-agent.js'), ...args]
      : this.getProviderArgs(provider, providerSettings, args);

    const proc = spawn(executable, scriptArgs, {
      cwd: projectPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    return proc;
  }

  private getProviderExecutable(provider: AIProvider, providerSettings: ProviderConfig | undefined): string {
    switch (provider) {
      case 'claude':
        return providerSettings?.executable || 'claude';
      case 'openai':
      case 'anthropic':
      case 'gemini':
      case 'custom':
        // These would use a custom agent runner script
        return 'node';
      default:
        return 'claude';
    }
  }

  private getProviderArgs(provider: AIProvider, providerSettings: ProviderConfig | undefined, baseArgs: string[]): string[] {
    // For API-based providers, we use a custom agent runner script
    const scriptPath = join(__dirname, `../../../agent-runners/${provider}-runner.js`);
    return [scriptPath, ...baseArgs];
  }

  private setupProcessHandlers(agentId: string, process: ChildProcess): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    process.stdout?.on('data', (data) => {
      this.handleAgentOutput(agentId, data.toString());
    });

    process.stderr?.on('data', (data) => {
      console.error(`Agent ${agentId} stderr:`, data.toString());
    });

    process.on('close', (code) => {
      this.handleAgentExit(agentId, code ?? -1);
    });

    process.on('error', (error) => {
      console.error(`Agent ${agentId} error:`, error);
      this.handleAgentExit(agentId, -1);
    });

    // Handle IPC messages from Claude Code (if available)
    if ('on' in process && typeof process.on === 'function') {
      process.on('message', (message: TelemetryEvent) => {
        if (message && message.type) {
          this.emitTelemetry(message);
        }
      });
    }
  }

  private handleAgentOutput(agentId: string, output: string): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.lastHeartbeat = Date.now();

    // Parse output for activity signals
    const lines = output.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      this.parseAgentOutput(agentId, line);
    }
  }

  private parseAgentOutput(agentId: string, line: string): void {
    // Look for structured output from Claude Code
    // Format: [MISSION_CONTROL] {type: "...", data: {...}}
    const match = line.match(/\[MISSION_CONTROL\]\s*(\{.*\})/);
    if (match) {
      try {
        const event = JSON.parse(match[1]) as TelemetryEvent;
        event.agentId = agentId;
        event.timestamp = Date.now();
        this.emitTelemetry(event);
        return;
      } catch {
        // Not valid JSON, treat as regular output
      }
    }

    // Parse common patterns
    if (line.includes('Working on:') || line.includes('Starting task:')) {
      const task = line.split(':').slice(1).join(':').trim();
      this.updateAgentTask(agentId, task);
      this.addActivity(agentId, {
        type: 'started-task',
        message: `Working on: ${task}`,
      });
    } else if (line.includes('Completed:') || line.includes('Done:')) {
      const task = line.split(':').slice(1).join(':').trim();
      this.updateAgentTask(agentId, null);
      this.updateAgentState(agentId, 'idle');
      this.addActivity(agentId, {
        type: 'completed-task',
        message: `Completed: ${task}`,
      });
      // Send agent to lounge for break
      this.setAgentTargetPosition(agentId, this.LOUNGE_POSITION);
      this.updateAgentState(agentId, 'break');
    } else if (line.includes('Error:') || line.includes('Failed:')) {
      this.updateAgentState(agentId, 'error');
      this.addActivity(agentId, {
        type: 'error',
        message: line,
      });
    } else if (line.includes('Meeting') || line.includes('Standup')) {
      this.setAgentTargetPosition(agentId, this.MEETING_POSITION);
      this.updateAgentState(agentId, 'meeting');
      this.addActivity(agentId, {
        type: 'meeting-start',
        message: 'Joined meeting',
      });
    }
  }

  private handleAgentExit(agentId: string, code: number): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.process = null;
    this.updateAgentState(agentId, code === 0 ? 'idle' : 'error');
    this.addActivity(agentId, {
      type: code === 0 ? 'completed-task' : 'error',
      message: code === 0 ? 'Agent stopped' : `Agent exited with code ${code}`,
    });
    
    // Return to desk if not error
    if (code === 0) {
      this.setAgentTargetPosition(agentId, this.DESK_POSITIONS[agentProcess.agent.role] || { x: 100, y: 100 });
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess || !agentProcess.process) return;

    agentProcess.process.kill('SIGTERM');
    
    // Wait for graceful shutdown
    await this.delay(1000);
    
    if (agentProcess.process && !agentProcess.process.killed) {
      agentProcess.process.kill('SIGKILL');
    }
  }

  async stopAllAgents(): Promise<void> {
    for (const agentId of this.agents.keys()) {
      await this.stopAgent(agentId);
    }
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values()).map((ap) => ap.agent);
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId)?.agent;
  }

  updateAgentState(agentId: string, state: AgentState): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.agent.state = state;
    agentProcess.agent.lastActivity = Date.now();
    this.emit('agent-update', agentProcess.agent);
  }

  updateAgentPosition(agentId: string, position: Position): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.agent.position = position;
    this.emit('agent-update', agentProcess.agent);
  }

  setAgentTargetPosition(agentId: string, position: Position): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.agent.targetPosition = position;
    this.emit('agent-update', agentProcess.agent);
  }

  updateAgentTask(agentId: string, task: string | null): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.agent.currentTask = task;
    agentProcess.agent.taskProgress = task ? 0 : 100;
    this.emit('agent-update', agentProcess.agent);
  }

  updateAgentProgress(agentId: string, progress: number): void {
    const agentProcess = this.agents.get(agentId);
    if (!agentProcess) return;

    agentProcess.agent.taskProgress = Math.max(0, Math.min(100, progress));
    this.emit('agent-update', agentProcess.agent);
  }

  addActivity(agentId: string, activity: Omit<AgentActivity, 'id' | 'agentId' | 'timestamp'>): void {
    const newActivity: AgentActivity = {
      id: uuidv4(),
      agentId,
      ...activity,
      timestamp: Date.now(),
    };
    this.emit('activity', newActivity);
  }

  onTelemetry(callback: (event: TelemetryEvent) => void): () => void {
    this.telemetryCallbacks.add(callback);
    return () => this.telemetryCallbacks.delete(callback);
  }

  private emitTelemetry(event: TelemetryEvent): void {
    for (const callback of this.telemetryCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Telemetry callback error:', error);
      }
    }
    this.emit('telemetry', event);
  }

  setOfficeMap(map: any): void {
    this.officeMap = map;
  }

  getOfficeMap(): any {
    return this.officeMap;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Heartbeat monitoring
  startHeartbeatMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [agentId, agentProcess] of this.agents) {
        if (agentProcess.process && now - agentProcess.lastHeartbeat > 30000) {
          console.warn(`Agent ${agentId} heartbeat timeout`);
          this.handleAgentExit(agentId, -1);
        }
      }
    }, 10000);
  }
}