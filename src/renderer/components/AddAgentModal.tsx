/**
 * AddAgentModal - Create a new agent backed by Claude Code, an API key, or any
 * OpenAI-compatible endpoint.
 */

import React, { useState } from 'react';
import { AgentConfig, AgentRole, AIProvider, ProviderConfigMap } from '../../shared/types';

interface AddAgentModalProps {
  providers: ProviderConfigMap;
  onClose: () => void;
  onCreate: (agent: AgentConfig) => Promise<void>;
}

const ROLES: { value: AgentRole; label: string }[] = [
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'software-engineer', label: 'Software Engineer' },
  { value: 'ui-ux-designer', label: 'UI/UX Designer' },
  { value: 'qa-tester', label: 'QA Tester' },
  { value: 'product-owner', label: 'Product Owner' },
  { value: 'devops-engineer', label: 'DevOps Engineer' },
  { value: 'data-scientist', label: 'Data Scientist' },
  { value: 'security-engineer', label: 'Security Engineer' },
  { value: 'tech-writer', label: 'Tech Writer' },
  { value: 'custom', label: 'Custom Role' },
];

const PROVIDER_ORDER: AIProvider[] = ['claude', 'anthropic', 'openai', 'gemini', 'custom'];

export function AddAgentModal({ providers, onClose, onCreate }: AddAgentModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('software-engineer');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerSettings = providers[provider];
  const needsKey = providerSettings?.supportsApiKey !== false && provider !== 'claude';

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#0a0f1a',
    border: '1px solid #1e2a3a',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Give the agent a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        id: `${role}-${Date.now().toString(36)}`,
        name: name.trim(),
        role,
        description: description.trim() || `${ROLES.find((r) => r.value === role)?.label} agent`,
        personality: description.trim() || 'Focused and collaborative',
        provider,
        avatarPaths: { front: '', back: '', left: '', right: '', portrait: '' },
        providerConfig: {
          provider,
          model: model.trim() || providerSettings?.defaultModel || '',
          apiKey: apiKey.trim() || undefined,
          baseUrl: baseUrl.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1321',
          border: '1px solid #1e2a3a',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e2a3a' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Add Agent</h2>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
            Give it a role, pick a provider, and paste a key if the provider needs one.
          </p>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ada"
              autoFocus
              style={fieldStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AgentRole)}
              style={fieldStyle}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>What should it do?</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Reviews pull requests and fixes flaky tests"
              style={fieldStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Connect Via</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              style={fieldStyle}
            >
              {PROVIDER_ORDER.filter((key) => providers[key]).map((key) => (
                <option key={key} value={key}>{providers[key]?.name || key}</option>
              ))}
            </select>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
              {providerSettings?.description || 'Select how this agent reaches its model.'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Model Name</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={providerSettings?.defaultModel || 'e.g. gpt-4o-mini'}
              style={fieldStyle}
            />
          </div>

          {needsKey && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your provider API key"
                style={fieldStyle}
              />
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                Stored locally in your user data folder and sent only to this provider.
              </div>
            </div>
          )}

          {(provider === 'custom' || baseUrl) && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                style={fieldStyle}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 12px',
              background: '#ff444415',
              border: '1px solid #ff4444',
              borderRadius: '6px',
              color: '#ff8888',
              fontSize: '11px',
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1e2a3a',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: '#0a0f1a',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid #1e2a3a',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{
              padding: '9px 18px',
              background: saving ? '#1e2a3a' : '#00ff88',
              border: 'none',
              borderRadius: '6px',
              color: saving ? '#475569' : '#0a0f1a',
              fontSize: '11px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Adding...' : 'Add Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}
