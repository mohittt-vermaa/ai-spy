/**
 * Sidebar - Collapsible side panel with agent list, project list, and controls
 */

import React, { useState } from 'react';
import { Agent, Project } from '../../shared/types';
import { AgentList } from './AgentList';

interface SidebarProps {
  open: boolean;
  activePanel: 'agents' | 'tasks' | 'activity';
  onPanelChange: (panel: 'agents' | 'tasks' | 'activity') => void;
  agents: Agent[];
  projects: Project[];
  currentProject: Project | null;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onStartAgent: (agentId: string, task?: string) => void;
  onStopAgent: (agentId: string) => void;
}

export function Sidebar({ 
  open, 
  activePanel, 
  onPanelChange, 
  agents, 
  projects, 
  currentProject,
  onLoadProject,
  onDeleteProject,
  onStartAgent,
  onStopAgent
}: SidebarProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  if (!open) {
    return (
      <aside className="sidebar-collapsed" style={{
        width: '56px',
        background: '#0a0f1a',
        borderRight: '1px solid #1e2a3a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '12px',
        gap: '8px',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}>
        {['agents', 'tasks', 'activity'].map(panel => (
          <button
            key={panel}
            onClick={() => onPanelChange(panel as any)}
            className={`nav-button ${activePanel === panel ? 'active' : ''}`}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: activePanel === panel ? '#00ff8820' : 'transparent',
              borderRadius: '8px',
              color: activePanel === panel ? '#00ff88' : '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              position: 'relative',
            }}
            title={panel.charAt(0).toUpperCase() + panel.slice(1)}
          >
            {getPanelIcon(panel)}
            {activePanel === panel && (
              <div style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '20px',
                background: '#00ff88',
                borderRadius: '0 3px 3px 0',
              }} />
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ 
          padding: '8px', 
          color: '#334155', 
          fontSize: '10px', 
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Mission Control
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar" style={{
      width: '320px',
      background: '#0d1321',
      borderRight: '1px solid #1e2a3a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Navigation Tabs */}
      <div className="sidebar-tabs" style={{
        display: 'flex',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
      }}>
        {(['agents', 'tasks', 'activity'] as const).map(panel => (
          <button
            key={panel}
            onClick={() => onPanelChange(panel)}
            className={`tab ${activePanel === panel ? 'active' : ''}`}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: 'transparent',
              color: activePanel === panel ? '#00ff88' : '#64748b',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              borderBottom: activePanel === panel ? '2px solid #00ff88' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {getPanelIcon(panel)}
            <span>{panel.charAt(0).toUpperCase() + panel.slice(1)}</span>
            {panel === 'agents' && agents.length > 0 && (
              <span style={{
                background: '#00ff88',
                color: '#0a0f1a',
                borderRadius: '8px',
                padding: '1px 5px',
                fontSize: '9px',
              }}>
                {agents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="sidebar-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activePanel === 'agents' && (
          <AgentList
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            onAgentAction={handleAgentAction}
          />
        )}

        {activePanel === 'tasks' && (
          <ProjectTasksView
            projects={projects}
            currentProject={currentProject}
            onLoadProject={onLoadProject}
            onDeleteProject={onDeleteProject}
          />
        )}

        {activePanel === 'activity' && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '16px',
            gap: '12px',
          }}>
            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onStartAgent(agent.id)}
                  disabled={agent.state !== 'idle'}
                  style={{
                    padding: '10px 12px',
                    background: agent.state === 'idle' ? `${agent.color}20` : '#111827',
                    border: `1px solid ${agent.state === 'idle' ? agent.color : '#1e2a3a'}`,
                    borderRadius: '8px',
                    color: agent.state === 'idle' ? agent.color : '#475569',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: agent.state === 'idle' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: agent.color,
                    opacity: agent.state === 'idle' ? 1 : 0.3,
                  }} />
                  <span style={{ flex: 1, fontWeight: 500 }}>
                    Start {agent.name}
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>
                    {agent.role.replace(/-/g, ' ')}
                  </span>
                </button>
              ))}
              {agents.length === 0 && (
                <div style={{ textAlign: 'center', color: '#475569', padding: '20px', fontSize: '12px' }}>
                  No agents available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function ProjectTasksView({ 
  projects, 
  currentProject, 
  onLoadProject, 
  onDeleteProject 
}: { 
  projects: Project[]; 
  currentProject: Project | null; 
  onLoadProject: (id: string) => void; 
  onDeleteProject: (id: string) => void; 
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
          Projects
        </h3>
      </div>
      
      {projects.length === 0 ? (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#475569',
          gap: '12px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '48px' }}>📁</div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>No Projects</div>
          <div style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px' }}>
            Create a project to start managing tasks
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.map(project => (
            <div
              key={project.id}
              style={{
                padding: '12px',
                background: currentProject?.id === project.id ? '#00ff8815' : '#111827',
                border: currentProject?.id === project.id ? '1px solid #00ff88' : '1px solid #1e2a3a',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => onLoadProject(project.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    {project.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                    {project.path}
                  </div>
                </div>
                {currentProject?.id === project.id && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    background: '#00ff88',
                    color: '#0a0f1a',
                    fontWeight: 600,
                  }}>
                    Active
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#64748b' }}>
                <span>📝 {project.tasks.length} tasks</span>
                <span>🤖 {project.agents.length} agents</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function handleAgentAction(agentId: string, action: string) {
  console.log('Agent action:', agentId, action);
}

function getPanelIcon(panel: string): string {
  const icons: Record<string, string> = {
    agents: '🤖',
    tasks: '📋',
    activity: '📊',
  };
  return icons[panel] || '●';
}