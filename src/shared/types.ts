/**
 * Shared types for Agent Mission Control
 * Used by both main and renderer processes
 */

export type AIProvider = 'claude' | 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface AgentProviderConfig {
  provider?: AIProvider;
  // For Claude Code
  cliCommand?: string;
  // For OpenAI/Gemini/Custom API
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  // Custom provider config
  customConfig?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  provider: AIProvider;
  description: string;
  personality: string;
  avatar: AgentAvatar;
  position: Position;
  targetPosition: Position | null;
  state: AgentState;
  currentTask: string | null;
  taskProgress: number;
  lastActivity: number;
  color: string;
  providerConfig: AgentProviderConfig;
}

export type AgentRole = 
  | 'project-manager'
  | 'software-engineer'
  | 'ui-ux-designer'
  | 'qa-tester'
  | 'product-owner'
  | 'devops-engineer'
  | 'data-scientist'
  | 'security-engineer'
  | 'tech-writer'
  | 'custom';

export type AgentState = 
  | 'idle'
  | 'walking'
  | 'working'
  | 'thinking'
  | 'break'
  | 'meeting'
  | 'error';

export interface AgentAvatar {
  front: string;
  back: string;
  left: string;
  right: string;
  portrait: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string;
  bounds: Bounds;
  type: RoomType;
  color: string;
  assignedAgents: string[];
}

export type RoomType = 
  | 'desk'
  | 'meeting'
  | 'lounge'
  | 'kitchen'
  | 'server'
  | 'whiteboard'
  | 'custom';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OfficeMap {
  id: string;
  name: string;
  image: string;
  width: number;
  height: number;
  rooms: Room[];
  spawnPoints: Position[];
  walkableAreas: Bounds[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string | null;
  createdAt: number;
  updatedAt: number;
  priority: TaskPriority;
  tags: string[];
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AgentActivity {
  id: string;
  agentId: string;
  type: ActivityType;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type ActivityType = 
  | 'started-task'
  | 'completed-task'
  | 'moved-to-room'
  | 'started-break'
  | 'ended-break'
  | 'error'
  | 'message'
  | 'meeting-start'
  | 'meeting-end'
  | 'code-commit'
  | 'test-run'
  | 'deploy';

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  agents: string[];
  tasks: Task[];
  createdAt: number;
  updatedAt: number;
}

export interface AppConfig {
  office: OfficeConfig;
  agents: AgentConfig[];
  providers: ProviderConfigMap;
  claude: ClaudeConfig;
  ui: UIConfig;
}

export interface ProviderConfig {
  name: string;
  description: string;
  defaultModel: string;
  supportsApiKey: boolean;
  apiKeyEnvVar?: string;
  executable?: string;
  baseUrl?: string;
  configFields: string[];
}

/**
 * Per-provider settings map stored in AppConfig.providers
 */
export type ProviderConfigMap = Partial<Record<AIProvider, ProviderConfig>>;

export interface OfficeConfig {
  mapId: string;
  theme: string;
  highlightColor: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  provider: AIProvider;
  description: string;
  personality: string;
  avatarPaths: AgentAvatar;
  providerConfig: AgentProviderConfig;
}

export interface ClaudeConfig {
  executable: string;
  workspacePath: string;
  autoStart: boolean;
  telemetryPort: number;
}

export interface UIConfig {
  pixelScale: number;
  showGrid: boolean;
  animationSpeed: number;
  theme: 'dark' | 'light' | 'auto';
}

// IPC Message types
export interface IPCMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

export interface AgentSpawnRequest {
  agentId: string;
  projectPath: string;
  task?: string;
}

export interface AgentStatusUpdate {
  agentId: string;
  state: AgentState;
  position?: Position;
  currentTask?: string;
  taskProgress?: number;
}

export interface TelemetryEvent {
  type: 'agent-start' | 'agent-stop' | 'tool-use' | 'file-change' | 'command-run' | 'error';
  agentId: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// Terminal UI types
export interface TerminalTheme {
  background: string;
  foreground: string;
  accent: string;
  agentColors: Record<string, string>;
}

export interface TerminalDimensions {
  width: number;
  height: number;
}