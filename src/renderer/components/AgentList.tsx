/**
 * AgentList - Collapsible sidebar showing all agents with quick status
 */

import React, { useState } from 'react';
import { Agent, AgentState, AIProvider } from '../../shared/types';

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
  onAgentAction: (agentId: string, action: string) => void;
}

export function AgentList({ agents, selectedAgentId, onSelectAgent, onAgentAction }: AgentListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const agentsByRole = agents.reduce((acc, agent) => {
    if (!acc[agent.role]) acc[agent.role] = [];
    acc[agent.role].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  const roleOrder = [
    'project-manager',
    'software-engineer',
    'ui-ux-designer',
    'qa-tester',
    'product-owner',
    'devops-engineer',
    'data-scientist',
    'security-engineer',
    'tech-writer',
    'custom',
  ];

  const getStateColor = (state: AgentState) => {
    const colors: Record<AgentState, string> = {
      idle: '#64748b',
      walking: '#f8b500',
      working: '#00ff88',
      thinking: '#ffd700',
      break: '#6c5ce7',
      meeting: '#e84393',
      error: '#ff4757',
    };
    return colors[state] || '#64748b';
  };

  const getStateIcon = (state: AgentState) => {
    const icons: Record<AgentState, string> = {
      idle: '●',
      walking: '🚶',
      working: '⌨',
      thinking: '💭',
      break: '☕',
      meeting: '🤝',
      error: '✗',
    };
    return icons[state] || '●';
  };

  const formatRole = (role: string) => 
    role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const toggleCategory = (role: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  };

  return (
    <div className="agent-list" style={{
      height: '100%',
      background: '#0d1321',
      borderRadius: '8px',
      border: '1px solid #1e2a3a',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div className="list-header" style={{
        padding: '12px 16px',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase' }}>
          Agents ({agents.length})
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setCollapsedCategories(new Set())}
            title="Expand all"
            style={{ padding: '4px 8px', background: '#111827', border: '1px solid #1e2a3a', borderRadius: '4px', color: '#94a3b8', fontSize: '10px', cursor: 'pointer' }}
          >
            ⛶
          </button>
          <button
            onClick={() => setCollapsedCategories(new Set(Object.keys(agentsByRole)))}
            title="Collapse all"
            style={{ padding: '4px 8px', background: '#111827', border: '1px solid #1e2a3a', borderRadius: '4px', color: '#94a3b8', fontSize: '10px', cursor: 'pointer' }}
          >
            ⛷
          </button>
        </div>
      </div>

      {/* Agent List */}
      <div className="list-content" style={{ flex: 1, overflowY: 'auto' }}>
        {roleOrder
          .filter(role => agentsByRole[role]?.length)
          .map(role => {
            const roleAgents = agentsByRole[role];
            const isCollapsed = collapsedCategories.has(role);
            const workingCount = roleAgents.filter(a => a.state === 'working').length;
            const totalCount = roleAgents.length;

            return (
              <div key={role} className="agent-category">
                <button
                  onClick={() => toggleCategory(role)}
                  className="category-header"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: isCollapsed ? '#0a0f1a' : '#111827',
                    border: 'none',
                    borderBottom: '1px solid #1e2a3a',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    color: '#e2e8f0',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ 
                    transition: 'transform 0.2s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                    display: 'inline-block',
                    color: '#64748b',
                  }}>
                    ▶
                  </span>
                  <span style={{ flex: 1 }}>{formatRole(role)}</span>
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '8px',
                    fontSize: '9px',
                    background: workingCount > 0 ? '#00ff8820' : '#1e2a3a',
                    color: workingCount > 0 ? '#00ff88' : '#64748b',
                    fontWeight: 600,
                  }}>
                    {workingCount}/{totalCount}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="category-agents" style={{ padding: '4px 0' }}>
                    {roleAgents.map(agent => (
                      <AgentListItem
                        key={agent.id}
                        agent={agent}
                        isSelected={selectedAgentId === agent.id}
                        onClick={() => onSelectAgent(agent.id)}
                        onAction={(action) => onAgentAction(agent.id, action)}
                        getStateColor={getStateColor}
                        getStateIcon={getStateIcon}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        
        {agents.length === 0 && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#475569',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
            <div>No agents configured</div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: '#334155' }}>
              Add agents in Settings to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AgentListItemProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  onAction: (action: string) => void;
  getStateColor: (state: AgentState) => string;
  getStateIcon: (state: AgentState) => string;
}

function AgentListItem({ agent, isSelected, onClick, onAction, getStateColor, getStateIcon }: AgentListItemProps) {
  const stateColor = getStateColor(agent.state);
  const stateIcon = getStateIcon(agent.state);
  
  const providerIcons: Record<AIProvider, string> = {
    claude: '🤖',
    openai: '🟢',
    gemini: '🔷',
    anthropic: '🟣',
    custom: '⚙️',
  };

  return (
    <div className="agent-list-item" style={{
      padding: '8px 16px',
      cursor: 'pointer',
      background: isSelected ? `${agent.color}15` : 'transparent',
      borderLeft: isSelected ? `3px solid ${agent.color}` : '3px solid transparent',
      transition: 'background 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
      }}
    >
      <div className="agent-indicator" style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: stateColor,
        boxShadow: `0 0 6px ${stateColor}`,
        flexShrink: 0,
        position: 'relative',
      }}>
        {agent.state === 'working' && (
          <div style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            right: '-3px',
            bottom: '-3px',
            borderRadius: '50%',
            border: `1px solid ${stateColor}`,
            animation: 'pulse 1.5s infinite',
          }} />
        )}
      </div>

      <div className="agent-info" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '14px',
            marginRight: '4px',
          }}>
            {providerIcons[agent.provider || 'claude']}
          </span>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {agent.name}
          </span>
          <span style={{ 
            fontSize: '9px', 
            color: stateColor,
            fontWeight: 500,
          }}>
            {stateIcon}
          </span>
        </div>
        {agent.currentTask && (
          <div style={{ 
            fontSize: '9px', 
            color: '#64748b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '1px',
          }}>
            {agent.currentTask}
          </div>
        )}
        {agent.providerConfig?.model && (
          <div style={{ 
            fontSize: '8px', 
            color: '#475569',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '1px',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {agent.providerConfig.model}
          </div>
        )}
      </div>

      <div className="agent-progress" style={{
        fontSize: '10px',
        fontWeight: 600,
        color: agent.taskProgress > 0 ? '#f8b500' : '#334155',
        minWidth: '35px',
        textAlign: 'right',
      }}>
        {agent.taskProgress > 0 ? `${agent.taskProgress}%` : ''}
      </div>
    </div>
  );
}

function showContextMenu(x: number, y: number) {
  // Context menu would be implemented here
  // For now, we'll just log
  console.log('Context menu at', x, y);
}