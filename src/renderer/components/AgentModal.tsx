/**
 * AgentModal - Agent detail and control modal
 */

import React, { useState } from 'react';
import { Agent, AgentState, AgentRole, AIProvider, ProviderConfigMap, AgentProviderConfig } from '../../shared/types';

interface AgentModalProps {
  agentId: string;
  agent: Agent | undefined;
  onClose: () => void;
  onStart: (agentId: string, task?: string) => void;
  onStop: (agentId: string) => void;
  onUpdateProvider: (agentId: string, provider: AIProvider, providerConfig: AgentProviderConfig) => void;
  providers: ProviderConfigMap;
  currentProvider: AIProvider;
  currentProviderConfig: AgentProviderConfig;
}

export function AgentModal({ agentId, agent, onClose, onStart, onStop, onUpdateProvider, providers, currentProvider, currentProviderConfig }: AgentModalProps) {
  const [taskInput, setTaskInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(currentProvider);
  const [providerModel, setProviderModel] = useState(currentProviderConfig.model || '');
  const [providerApiKey, setProviderApiKey] = useState(currentProviderConfig.apiKey || '');
  const [providerBaseUrl, setProviderBaseUrl] = useState(currentProviderConfig.baseUrl || '');
  const [savingProvider, setSavingProvider] = useState(false);

  if (!agent) {
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
        onClick={onClose}
      >
        <div className="modal" style={{
          width: '400px',
          background: '#0d1321',
          border: '1px solid #1e2a3a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h2 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>Agent Not Found</h2>
          <p style={{ margin: 0, color: '#64748b' }}>The agent data is not available</p>
          <button
            onClick={onClose}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#00ff88',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0f1a',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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

  const formatRole = (role: AgentRole) => 
    role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleStart = async () => {
    setSending(true);
    try {
      await onStart(agent.id, taskInput.trim() || undefined);
    } finally {
      setSending(false);
      setTaskInput('');
    }
  };

  const handleStop = async () => {
    setSending(true);
    try {
      await onStop(agent.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}
      onClick={onClose}
    >
      <div className="modal" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        background: '#0d1321',
        border: '1px solid #1e2a3a',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{
          padding: '20px',
          background: '#0a0f1a',
          borderBottom: '1px solid #1e2a3a',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${agent.color}20, ${agent.color}40)`,
            border: `2px solid ${agent.color}`,
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
              background: getStateColor(agent.state),
              border: '2px solid #0a0f1a',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#e2e8f0' }}>
              {agent.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 600,
                color: '#0a0f1a',
                background: getStateColor(agent.state),
                textTransform: 'uppercase',
              }}>
                {agent.state}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {formatRole(agent.role)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-content" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
        }}>
          {/* Personality */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Personality
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{agent.personality}"
            </p>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Description
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {agent.description}
            </p>
          </div>

          {/* Current Task */}
          {agent.currentTask && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#111827', borderRadius: '8px', border: `1px solid ${agent.color}30` }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Current Task
              </h3>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>
                    {agent.currentTask}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8b500' }}>
                    {agent.taskProgress}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#0a0f1a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${agent.taskProgress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${agent.color}, ${agent.color}80)`,
                    borderRadius: '3px',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Start Agent with Task */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Start Agent
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Optional: Initial task description..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: '#111827',
                  border: '1px solid #1e2a3a',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none',
                }}
              />
              <button
                onClick={handleStart}
                disabled={sending || agent.state !== 'idle'}
                style={{
                  padding: '10px 16px',
                  background: agent.state === 'idle' ? '#00ff88' : '#1e2a3a',
                  border: 'none',
                  borderRadius: '6px',
                  color: agent.state === 'idle' ? '#0a0f1a' : '#475569',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: sending || agent.state !== 'idle' ? 'not-allowed' : 'pointer',
                  opacity: sending || agent.state !== 'idle' ? 0.5 : 1,
                }}
              >
                {sending ? 'Starting...' : 'Start'}
              </button>
            </div>
            {agent.state !== 'idle' && (
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                Agent must be idle to start. Current state: {agent.state}
              </div>
            )}
          </div>

          {/* Stop Agent */}
          {agent.state !== 'idle' && (
            <div>
              <button
                onClick={handleStop}
                disabled={sending}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: '#ff475720',
                  border: '1px solid #ff4757',
                  borderRadius: '6px',
                  color: '#ff4757',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.5 : 1,
                }}
              >
                {sending ? 'Stopping...' : 'Stop Agent'}
              </button>
            </div>
          )}

          {/* Provider Configuration */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1e2a3a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                AI Provider
              </h3>
              <button
                onClick={() => setShowProviderConfig(!showProviderConfig)}
                style={{
                  padding: '4px 10px',
                  background: showProviderConfig ? '#00ff8820' : 'transparent',
                  border: '1px solid #1e2a3a',
                  borderRadius: '4px',
                  color: showProviderConfig ? '#00ff88' : '#64748b',
                  fontSize: '10px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {showProviderConfig ? 'Hide' : 'Configure'}
              </button>
            </div>

            {/* Current Provider Display */}
            <div style={{ marginBottom: '12px', padding: '12px', background: '#111827', borderRadius: '8px', border: '1px solid #1e2a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Current:</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                  {providers[currentProvider]?.name || currentProvider}
                </span>
                {currentProviderConfig.model && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
                    {currentProviderConfig.model}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {providers[currentProvider]?.description || 'Default provider configuration'}
              </div>
            </div>

            {/* Provider Configuration Form */}
            {showProviderConfig && (
              <div style={{ padding: '16px', background: '#111827', borderRadius: '8px', border: '1px solid #1e2a3a' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0f1a',
                      border: '1px solid #1e2a3a',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.entries(providers).map(([key, provider]) => (
                      <option key={key} value={key}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={providerModel}
                    onChange={(e) => setProviderModel(e.target.value)}
                    placeholder={providers[selectedProvider]?.defaultModel || 'e.g., gpt-4o, claude-3-5-sonnet-20241022'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0f1a',
                      border: '1px solid #1e2a3a',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                  />
                </div>

                {providers[selectedProvider]?.supportsApiKey && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={providerApiKey}
                      onChange={(e) => setProviderApiKey(e.target.value)}
                      placeholder="Enter your API key..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0a0f1a',
                        border: '1px solid #1e2a3a',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none',
                      }}
                    />
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                      Stored securely in config. Not sent to any external service except the AI provider.
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Base URL (Optional - for custom endpoints)
                  </label>
                  <input
                    type="text"
                    value={providerBaseUrl}
                    onChange={(e) => setProviderBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0f1a',
                      border: '1px solid #1e2a3a',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={async () => {
                    setSavingProvider(true);
                    try {
                      await onUpdateProvider(agent.id, selectedProvider, {
                        model: providerModel || undefined,
                        apiKey: providerApiKey || undefined,
                        baseUrl: providerBaseUrl || undefined,
                      });
                    } finally {
                      setSavingProvider(false);
                    }
                  }}
                  disabled={savingProvider}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: savingProvider ? '#1e2a3a' : '#00ff88',
                    border: 'none',
                    borderRadius: '6px',
                    color: savingProvider ? '#475569' : '#0a0f1a',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: savingProvider ? 'not-allowed' : 'pointer',
                    opacity: savingProvider ? 0.5 : 1,
                  }}
                >
                  {savingProvider ? 'Saving...' : 'Save Provider Config'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Quick Stats */}
        <div className="modal-footer" style={{
          padding: '16px 20px',
          background: '#0a0f1a',
          borderTop: '1px solid #1e2a3a',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#00ff88' }}>
              {agent.taskProgress}%
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>
              Progress
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#00d9ff' }}>
              {Date.now() - agent.lastActivity < 60000 ? 'Active' : 'Idle'}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>
              Status
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8b500' }}>
              {agent.color}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>
              Color
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}