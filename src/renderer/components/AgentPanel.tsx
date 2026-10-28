/**
 * AgentPanel - Side panel showing agent details, tasks, and controls
 */

import React, { useState, useMemo } from 'react';
import { Agent, Task, AgentState } from '../../shared/types';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface AgentPanelProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
  tasks: Task[];
  onAssignTask: (agentId: string, taskId: string) => void;
  onSendMessage: (agentId: string, message: string) => void;
}

export function AgentPanel({ 
  agents, 
  selectedAgentId, 
  onSelectAgent, 
  tasks, 
  onAssignTask, 
  onSendMessage 
}: AgentPanelProps) {
  const [messageInput, setMessageInput] = useState('');

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId), 
    [agents, selectedAgentId]
  );

  const unassignedTasks = useMemo(() => 
    tasks.filter(t => !t.assignee && t.status === 'todo'),
    [tasks]
  );

  const agentTasks = useMemo(() => 
    tasks.filter(t => t.assignee === selectedAgentId),
    [tasks, selectedAgentId]
  );

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

  if (!selectedAgent) {
    return (
      <div className="agent-panel-empty" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
        <h3 style={{ margin: '0 0 8px', color: '#94a3b8' }}>No Agent Selected</h3>
        <p style={{ margin: 0, fontSize: '13px', maxWidth: '200px' }}>
          Click an agent in the office view or list to see details
        </p>
      </div>
    );
  }

  return (
    <div className="agent-panel" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1321',
      borderRadius: '8px',
      border: '1px solid #1e2a3a',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Agent Header */}
      <div className="agent-header" style={{
        padding: '16px',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div className="agent-avatar" style={{
          width: '64px',
          height: '64px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${selectedAgent.color}20, ${selectedAgent.color}40)`,
          border: `2px solid ${selectedAgent.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: getStateColor(selectedAgent.state),
            border: '2px solid #0a0f1a',
            boxShadow: `0 0 8px ${getStateColor(selectedAgent.state)}`,
          }} />
        </div>
        <div className="agent-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>
              {selectedAgent.name}
            </h2>
            <span className="state-badge" style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#0a0f1a',
              background: getStateColor(selectedAgent.state),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {getStateIcon(selectedAgent.state)} {selectedAgent.state}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
            {selectedAgent.role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
            "{selectedAgent.personality}"
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="agent-stats" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '12px 16px',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
        gap: '8px',
      }}>
        <StatItem label="Tasks" value={agentTasks.length} color="#00d9ff" />
        <StatItem label="Progress" value={`${selectedAgent.taskProgress}%`} color="#f8b500" />
        <StatItem label="Active" value={formatDuration(Date.now() - selectedAgent.lastActivity)} color="#00ff88" />
      </div>

      {/* Current Task */}
      <div className="current-task" style={{ padding: '16px', borderBottom: '1px solid #1e2a3a' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Current Task
          </h4>
          {selectedAgent.currentTask && (
            <span style={{
              fontSize: '10px',
              color: '#00ff88',
              background: '#00ff8820',
              padding: '2px 6px',
              borderRadius: '4px',
            }}>
              {selectedAgent.taskProgress}%
            </span>
          )}
        </div>
        {selectedAgent.currentTask ? (
          <div className="task-progress">
            <div style={{ 
              height: '6px', 
              background: '#111827', 
              borderRadius: '3px', 
              overflow: 'hidden',
              marginBottom: '4px',
            }}>
              <div style={{
                width: `${selectedAgent.taskProgress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${selectedAgent.color}, ${selectedAgent.color}80)`,
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '12px', lineHeight: 1.5 }}>
              {selectedAgent.currentTask}
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>
            No active task
          </p>
        )}
      </div>

      {/* Assigned Tasks */}
      <div className="assigned-tasks" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #1e2a3a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            Assigned Tasks ({agentTasks.length})
          </h4>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {agentTasks.length === 0 ? (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#475569',
              fontSize: '12px',
              gap: '8px',
            }}>
              <div style={{ fontSize: '24px' }}>📝</div>
              <div>No tasks assigned</div>
              <button
                onClick={() => onSendMessage(selectedAgent.id, 'Create a task for this agent')}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: selectedAgent.color + '20',
                  border: `1px solid ${selectedAgent.color}`,
                  borderRadius: '4px',
                  color: selectedAgent.color,
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Create Task
              </button>
            </div>
          ) : (
            agentTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                agentColor={selectedAgent.color}
              />
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input" style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #1e2a3a',
        background: '#0a0f1a',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && messageInput.trim()) {
                onSendMessage(selectedAgent.id, messageInput.trim());
                setMessageInput('');
              }
            }}
            placeholder="Send message to agent..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#111827',
              border: '1px solid #1e2a3a',
              borderRadius: '4px',
              color: '#e2e8f0',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
            }}
          />
          <button
            onClick={() => {
              if (messageInput.trim()) {
                onSendMessage(selectedAgent.id, messageInput.trim());
                setMessageInput('');
              }
            }}
            disabled={!messageInput.trim()}
            style={{
              padding: '8px 16px',
              background: selectedAgent.color,
              border: 'none',
              borderRadius: '4px',
              color: '#0a0f1a',
              fontSize: '11px',
              fontWeight: 600,
              cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
              opacity: messageInput.trim() ? 1 : 0.5,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '8px',
      background: '#111827',
      borderRadius: '6px',
    }}>
      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 700, color }}>
        {value}
      </span>
    </div>
  );
}

function TaskCard({ task, agentColor }: { task: Task; agentColor: string }) {
  const priorityColors = {
    low: '#64748b',
    medium: '#f8b500',
    high: '#fd79a8',
    critical: '#ff4757',
  };

  const statusColors = {
    todo: '#64748b',
    'in-progress': '#00ff88',
    review: '#f8b500',
    done: '#00d9ff',
    blocked: '#ff4757',
  };

  return (
    <div style={{
      marginBottom: '8px',
      padding: '10px',
      background: '#111827',
      borderRadius: '6px',
      border: `1px solid ${agentColor}30`,
      borderLeft: `3px solid ${priorityColors[task.priority]}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
          {task.title}
        </span>
        <span style={{
          fontSize: '9px',
          padding: '1px 6px',
          borderRadius: '3px',
          background: statusColors[task.status] + '20',
          color: statusColors[task.status],
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {task.status.replace('-', ' ')}
        </span>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
        {task.description}
      </p>
      <div style={{ display: 'flex', gap: '8px', fontSize: '9px', color: '#475569' }}>
        <span style={{ color: priorityColors[task.priority] }}>
          ● {task.priority}
        </span>
        {task.tags.length > 0 && (
          <span>
            {task.tags.map(t => `#${t}`).join(' ')}
          </span>
        )}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return 'now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}