/**
 * ConfigManager - Handles application configuration persistence
 */

import { app } from 'electron';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  AppConfig,
  AgentConfig,
  OfficeConfig,
  ClaudeConfig,
  UIConfig,
  AgentRole,
  AgentAvatar,
  ProviderConfig,
  ProviderConfigMap,
  AgentProviderConfig,
  AIProvider,
} from '../../shared/types.js';

const DEFAULT_PROVIDERS: Record<AIProvider, ProviderConfig> = {
  claude: {
    name: 'Claude Code',
    description: 'Local Claude Code CLI running in your project folder',
    executable: 'claude',
    defaultModel: 'claude-sonnet-4-5',
    supportsApiKey: false,
    configFields: ['executable', 'workspacePath'],
  },
  anthropic: {
    name: 'Anthropic API',
    description: 'Direct Anthropic API access with your own key',
    defaultModel: 'claude-sonnet-4-5',
    supportsApiKey: true,
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    configFields: ['apiKey', 'model', 'baseUrl'],
  },
  openai: {
    name: 'OpenAI',
    description: 'ChatGPT / GPT models through the OpenAI API',
    defaultModel: 'gpt-4o',
    supportsApiKey: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    configFields: ['apiKey', 'model', 'baseUrl'],
  },
  gemini: {
    name: 'Gemini',
    description: 'Google Gemini models through the Gemini API',
    defaultModel: 'gemini-1.5-pro',
    supportsApiKey: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    configFields: ['apiKey', 'model', 'baseUrl'],
  },
  custom: {
    name: 'Custom (OpenAI-compatible)',
    description: 'Any OpenAI-compatible endpoint: OpenRouter, Groq, Ollama, LM Studio...',
    defaultModel: '',
    supportsApiKey: true,
    apiKeyEnvVar: 'CUSTOM_API_KEY',
    configFields: ['apiKey', 'model', 'baseUrl'],
  },
};

const DEFAULT_CONFIG: AppConfig = {
  office: {
    mapId: 'default',
    theme: 'cyberpunk',
    highlightColor: '#00ff88',
  },
  agents: [
    {
      id: 'pm-1',
      name: 'Nova',
      role: 'project-manager',
      description: 'Keeps the team aligned and on schedule',
      personality: 'Organized, encouraging, big-picture thinker',
      avatarPaths: {
        front: 'raw/nova/front.png',
        back: 'raw/nova/back.png',
        left: 'raw/nova/left.png',
        right: 'raw/nova/right.png',
        portrait: 'raw/nova/portrait.png',
      },
      provider: 'claude',
      providerConfig: {
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    {
      id: 'se-1',
      name: 'Codex',
      role: 'software-engineer',
      description: 'Writes clean, maintainable code',
      personality: 'Logical, detail-oriented, loves refactoring',
      avatarPaths: {
        front: 'raw/codex/front.png',
        back: 'raw/codex/back.png',
        left: 'raw/codex/left.png',
        right: 'raw/codex/right.png',
        portrait: 'raw/codex/portrait.png',
      },
      provider: 'claude',
      providerConfig: {
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    {
      id: 'ux-1',
      name: 'Pixel',
      role: 'ui-ux-designer',
      description: 'Crafts beautiful, intuitive interfaces',
      personality: 'Creative, empathetic, pixel-perfect',
      avatarPaths: {
        front: 'raw/pixel/front.png',
        back: 'raw/pixel/back.png',
        left: 'raw/pixel/left.png',
        right: 'raw/pixel/right.png',
        portrait: 'raw/pixel/portrait.png',
      },
      provider: 'claude',
      providerConfig: {
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    {
      id: 'qa-1',
      name: 'Check',
      role: 'qa-tester',
      description: 'Ensures quality through rigorous testing',
      personality: 'Thorough, skeptical, finds edge cases',
      avatarPaths: {
        front: 'raw/check/front.png',
        back: 'raw/check/back.png',
        left: 'raw/check/left.png',
        right: 'raw/check/right.png',
        portrait: 'raw/check/portrait.png',
      },
      provider: 'claude',
      providerConfig: {
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    {
      id: 'po-1',
      name: 'Vision',
      role: 'product-owner',
      description: 'Defines what to build and why',
      personality: 'Strategic, user-focused, decisive',
      avatarPaths: {
        front: 'raw/vision/front.png',
        back: 'raw/vision/back.png',
        left: 'raw/vision/left.png',
        right: 'raw/vision/right.png',
        portrait: 'raw/vision/portrait.png',
      },
      provider: 'claude',
      providerConfig: {
        model: 'claude-3-5-sonnet-20241022',
      },
    },
  ],
  providers: DEFAULT_PROVIDERS,
  claude: {
    executable: 'claude',
    workspacePath: '',
    autoStart: false,
    telemetryPort: 8765,
  },
  ui: {
    pixelScale: 2,
    showGrid: false,
    animationSpeed: 1.0,
    theme: 'dark',
  },
};

export class ConfigManager {
  private config: AppConfig = DEFAULT_CONFIG;
  private configPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = join(userDataPath, 'config.json');
  }

  async load(): Promise<AppConfig> {
    try {
      if (existsSync(this.configPath)) {
        const data = await readFile(this.configPath, 'utf-8');
        const loaded = JSON.parse(data) as Partial<AppConfig>;
        this.config = this.mergeConfig(DEFAULT_CONFIG, loaded);
      }
    } catch (error) {
      console.error('Failed to load config, using defaults:', error);
      this.config = DEFAULT_CONFIG;
    }
    return this.config;
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.configPath, '..');
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  updateOfficeConfig(updates: Partial<OfficeConfig>): void {
    this.config.office = { ...this.config.office, ...updates };
  }

  updateClaudeConfig(updates: Partial<ClaudeConfig>): void {
    this.config.claude = { ...this.config.claude, ...updates };
  }

  updateUIConfig(updates: Partial<UIConfig>): void {
    this.config.ui = { ...this.config.ui, ...updates };
  }

  addAgent(agent: AgentConfig): void {
    this.config.agents.push(agent);
  }

  removeAgent(agentId: string): void {
    this.config.agents = this.config.agents.filter((a) => a.id !== agentId);
  }

  updateAgent(agentId: string, updates: Partial<AgentConfig>): void {
    const index = this.config.agents.findIndex((a) => a.id === agentId);
    if (index !== -1) {
      this.config.agents[index] = { ...this.config.agents[index], ...updates };
    }
  }

  // Provider management
  getProviders(): ProviderConfigMap {
    return this.config.providers ?? DEFAULT_PROVIDERS;
  }

  getProvider(provider: AIProvider): ProviderConfig {
    return this.config.providers?.[provider] ?? DEFAULT_PROVIDERS[provider];
  }

  updateProvider(provider: AIProvider, updates: Partial<ProviderConfig>): void {
    this.config.providers = {
      ...this.config.providers,
      [provider]: { ...this.config.providers?.[provider], ...updates },
    };
  }

  getAgentProviderConfig(agentId: string): AgentProviderConfig | undefined {
    const agent = this.config.agents.find((a) => a.id === agentId);
    return agent?.providerConfig;
  }

  updateAgentProvider(agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig): void {
    const index = this.config.agents.findIndex((a) => a.id === agentId);
    if (index !== -1) {
      this.config.agents[index].provider = provider;
      this.config.agents[index].providerConfig = providerConfig;
    }
  }

  private mergeConfig(base: AppConfig, updates: Partial<AppConfig>): AppConfig {
    return {
      office: { ...base.office, ...updates.office },
      agents: updates.agents ?? base.agents,
      providers: updates.providers ?? base.providers ?? DEFAULT_PROVIDERS,
      claude: { ...base.claude, ...updates.claude },
      ui: { ...base.ui, ...updates.ui },
    };
  }

  getConfigPath(): string {
    return this.configPath;
  }
}