/**
 * Agent Mission Control - Main App Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { OfficeView } from './components/OfficeView';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ActivityFeed } from './components/ActivityFeed';
import { TaskBoard } from './components/TaskBoard';
import { ProjectModal } from './components/ProjectModal';
import { AgentModal } from './components/AgentModal';
import { SettingsModal } from './components/SettingsModal';
import { AddAgentModal } from './components/AddAgentModal';
import { useElectronAPI } from './hooks/useElectronAPI';
import { Agent, Project, Task, AgentActivity, AppConfig, AIProvider, ProviderConfigMap, AgentProviderConfig, AgentConfig } from '../shared/types';

export function App() {
  const api = useElectronAPI();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [providers, setProviders] = useState<ProviderConfigMap | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<'agents' | 'tasks' | 'activity'>('agents');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
    
    // Subscribe to agent updates
    const unsubAgent = api.agents.onUpdate((agent) => {
      setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    });
    
    // Subscribe to activities
    const unsubActivity = api.agents.onActivity((activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 100));
    });
    
    return () => {
      unsubAgent();
      unsubActivity();
    };
  }, [api]);

  const loadData = async () => {
    try {
      const [cfg, agts, projs, currProj, provs] = await Promise.all([
        api.config.get(),
        api.agents.getAll(),
        api.projects.getAll(),
        api.projects.getCurrent(),
        api.providers.getAll(),
      ]);
      
      setConfig(cfg);
      setAgents(agts);
      setProjects(projs);
      setCurrentProject(currProj);
      setProviders(provs);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  const handleCreateProject = useCallback(async (name: string, path: string, description: string) => {
    const project = await api.projects.create(name, path, description);
    setProjects(prev => [project, ...prev]);
    setCurrentProject(project);
    setShowProjectModal(false);
  }, [api]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const project = await api.projects.load(projectId);
    if (project) {
      setCurrentProject(project);
    }
  }, [api]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    await api.projects.delete(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  }, [api, currentProject]);

  const handleStartAgent = useCallback(async (agentId: string, task?: string) => {
    await api.agents.start(agentId, task);
  }, [api]);

  const handleStopAgent = useCallback(async (agentId: string) => {
    await api.agents.stop(agentId);
  }, [api]);

  const handleAddTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentProject) return;
    const newTask = await api.tasks.add(currentProject.id, task);
    // Update current project with new task
    setCurrentProject(prev => prev ? {
      ...prev,
      tasks: [...prev.tasks, newTask]
    } : null);
  }, [api, currentProject]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!currentProject) return;
    await api.tasks.update(currentProject.id, taskId, updates);
    setCurrentProject(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    } : null);
  }, [api, currentProject]);

  const handleMoveTask = useCallback(async (taskId: string, status: Task['status']) => {
    if (!currentProject) return;
    await api.tasks.move(currentProject.id, taskId, status);
    setCurrentProject(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status } : t)
    } : null);
  }, [api, currentProject]);

  const handleAssignTask = useCallback(async (taskId: string, agentId: string | null) => {
    if (!currentProject) return;
    await api.tasks.assign(currentProject.id, taskId, agentId);
    setCurrentProject(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, assignee: agentId } : t)
    } : null);
  }, [api, currentProject]);

  const handleUpdateProvider = useCallback(async (agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig) => {
    await api.agents.updateProvider(agentId, provider, providerConfig);
    // Reload agents to get updated config
    const agts = await api.agents.getAll();
    setAgents(agts);
  }, [api]);

  const handleCreateAgent = useCallback(async (agentConfig: AgentConfig) => {
    await api.agents.add(agentConfig);
    const agts = await api.agents.getAll();
    setAgents(agts);
  }, [api]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="currentColor"/>
              <path d="M16 20h32M16 32h24M16 44h16" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="loading-text">Agent Mission Control</p>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar
        config={config}
        currentProject={currentProject}
        onNewProject={() => setShowProjectModal(true)}
        onSettings={() => setShowSettingsModal(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="app-body">
        <Sidebar
          open={sidebarOpen}
          activePanel={activePanel}
          onPanelChange={setActivePanel}
          agents={agents}
          projects={projects}
          currentProject={currentProject}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onStartAgent={handleStartAgent}
          onStopAgent={handleStopAgent}
        />
        
        <main className="main-content">
          <div className="office-area">
            <OfficeView
              agents={agents}
              config={config}
              currentProject={currentProject}
            />
          </div>
          
          <div className="panel-area">
            {activePanel === 'agents' && (
              <div className="panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>Agent Roster</h3>
                  <button
                    onClick={() => setShowAddAgent(true)}
                    style={{
                      padding: '7px 12px',
                      background: '#00ff8815',
                      border: '1px solid #00ff88',
                      borderRadius: '6px',
                      color: '#00ff88',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Agent
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => setShowAgentModal(agent.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: '#111827',
                        border: '1px solid #1e2a3a',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: agent.color,
                        boxShadow: `0 0 6px ${agent.color}`,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 600 }}>{agent.name}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{agent.role}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '9px', color: '#475569', textTransform: 'uppercase' }}>
                        {agent.provider} · {agent.state}
                      </span>
                    </button>
                  ))}
                  {agents.length === 0 && (
                    <div style={{ fontSize: '11px', color: '#475569' }}>
                      No agents yet — add one to staff your office.
                    </div>
                  )}
                </div>
              </div>
            )}
            {activePanel === 'tasks' && (
              <TaskBoard
                project={currentProject}
                agents={agents}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onMoveTask={handleMoveTask}
                onAssignTask={handleAssignTask}
              />
            )}
            {activePanel === 'activity' && (
              <ActivityFeed activities={activities} agents={agents} />
            )}
          </div>
        </main>
      </div>

      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          onCreate={handleCreateProject}
          projects={projects}
        />
      )}

      {showAgentModal && (
        <AgentModal
          agentId={showAgentModal}
          agent={agents.find(a => a.id === showAgentModal)}
          onClose={() => setShowAgentModal(null)}
          onStart={handleStartAgent}
          onStop={handleStopAgent}
          onUpdateProvider={handleUpdateProvider}
          providers={providers || {}}
          currentProvider={agents.find(a => a.id === showAgentModal)?.provider || 'claude'}
          currentProviderConfig={agents.find(a => a.id === showAgentModal)?.providerConfig || {}}
        />
      )}

      {showAddAgent && (
        <AddAgentModal
          providers={providers || {}}
          onClose={() => setShowAddAgent(false)}
          onCreate={handleCreateAgent}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettingsModal(false)}
          onSave={async (updates) => {
            const newConfig = await api.config.update(updates);
            setConfig(newConfig);
          }}
        />
      )}
    </div>
  );
}